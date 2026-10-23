"""Exports the prepared room (out/room.blend) as a GLB for the viewer: no lights, no product.

  blender -b out/room.blend --python export.py
Writes out/room-raw.glb (compress it with compress.mjs).

Lighting lives in the viewer. So it lines up with the room's fittings, the export carries empty
"anchor" nodes whose glTF extras say what they mark (`twirl_anchor`): the product spot, the sun,
the window, sconces, pendant and downlights.
"""

import bpy
import os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')


def restore_glass():
    """prepare.py routes window glass through a Light Path trick for Cycles; glTF can't export
    that, so connect the Principled BSDF straight to the output again."""
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        mix = next((n for n in nodes if n.type == 'MIX_SHADER'), None)
        path = next((n for n in nodes if n.type == 'LIGHT_PATH'), None)
        bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
        out = next((n for n in nodes if n.type == 'OUTPUT_MATERIAL'), None)
        if mix and path and bsdf and out:
            links.new(bsdf.outputs[0], out.inputs['Surface'])


# Subdivision kept for real time: none. Each level quadruples the faces, and the base meshes
# are already smooth-shaded.
MAX_SUBDIVISION = 0


def realtime_detail():
    """The pendant is subdivided four times (14k faces become 7.3M); cap subdivision so the room
    stays light enough for phones."""
    for obj in bpy.context.scene.objects:
        for mod in getattr(obj, 'modifiers', []):
            if mod.type == 'SUBSURF' and max(mod.levels, mod.render_levels) > MAX_SUBDIVISION:
                print(f'{obj.name}: subdivision {mod.render_levels} → {MAX_SUBDIVISION}')
                mod.levels = mod.render_levels = MAX_SUBDIVISION


def repair_meshes():
    """Fixes invalid mesh data from the source scene (the dining sphere has some)."""
    for mesh in bpy.data.meshes:
        if mesh.users and mesh.validate(verbose=False):
            print(f'repaired {mesh.name}')


def anchor(name, kind, location, target=None, **extra):
    obj = bpy.data.objects.new(name, None)
    obj.location = location
    if target is not None:
        # Where it points, in glTF coordinates (y up, z toward the viewer): the viewer aims
        # lights with it directly, without depending on axis conversion of the node's rotation.
        x, y, z = target
        obj['target'] = [x, z, -y]
    obj['twirl_anchor'] = kind
    for key, value in extra.items():
        obj[key] = value
    bpy.context.scene.collection.objects.link(obj)
    return obj


def anchors():
    """Marks what the viewer's lights need, taken from the preview light rigs."""
    lights = {o.name: o for o in bpy.data.objects if o.type == 'LIGHT'}
    anchor('Anchor_Product', 'product', (1.80, 4.60, 0.0))
    sun = lights['Sun']
    # Aim point for the sun: where its light lands through the window.
    anchor('Anchor_Sun', 'sun', sun.location, (0.55, 4.75, 0.0))
    window = lights['Window_Skylight']
    anchor('Anchor_Window', 'window', window.location, (3.0, 4.99, 1.0),
           width=window.data.size, height=window.data.size_y)
    for name, obj in lights.items():
        if name.startswith('Sconce_Night'):
            anchor(f'Anchor_{name.replace("_Night", "")}', 'sconce', obj.location)
        elif name.startswith('Downlight'):
            anchor(f'Anchor_{name}', 'downlight', obj.location,
                   (obj.location.x, obj.location.y, 0.0))
        elif name == 'Pendant_Glow':
            anchor('Anchor_Pendant', 'pendant', obj.location)


def main():
    restore_glass()
    repair_meshes()
    realtime_detail()
    anchors()
    product = bpy.data.collections.get('Product')
    for obj in bpy.context.scene.objects:
        hidden = obj.type in ('LIGHT', 'CAMERA') or (product and obj in set(product.all_objects))
        obj.hide_set(hidden)
        obj.hide_render = hidden
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, 'room-raw.glb')
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_visible=True,
        export_apply=True,  # wall thickness and the scene's own modifiers
        export_extras=True,  # anchor metadata
        export_lights=False,
        export_cameras=False,
        export_animations=False,
        export_image_format='AUTO',
    )
    print('exported', path, os.path.getsize(path) // 1024, 'KB')


main()
