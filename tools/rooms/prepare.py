"""Prepares the showroom room for Twirl: cleans the source scene, adds finishes and lighting.

Run with Blender (never edits the source file; writes out/room.blend):
  blender -b <source scene.blend> --python prepare.py -- --product <optional .gltf to preview>

Coordinates are Blender's (z up). The product spot is the centre of the living-room rug, with
the product facing -y (glTF's +z front), into the room; the window is on its left.
"""

import bpy
import bmesh
import hashlib
import json
import math
import os
import sys
import urllib.request
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, 'out')
PRODUCT_SPOT = Vector((1.80, 4.60, 0.0))

# Poly Haven "Laminate Floor 02" (CC0), 2k, pinned by MD5.
FLOOR = {
    'diff': ('laminate_floor_02_diff_2k.jpg', 'e106d121c9abb78f80e72cb5bd003295'),
    'nor': ('laminate_floor_02_nor_gl_2k.jpg', 'ef2dc661cf7a24fa1c2577fd10754014'),
    'rough': ('laminate_floor_02_rough_2k.jpg', '06663cee617c49b117e0e9466fd1486d'),
}
FLOOR_URL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/laminate_floor_02/'
FLOOR_TILE_M = 1.7  # the texture covers 1.7 m


# Staging pieces from Poly Haven (CC0, 2k): id → MD5 of its .gltf (a changed source fails).
STAGING_MODELS = {
    'potted_plant_01': 'a3afe93c4e0ba15a6b825a5d23ba46a8',
    'hanging_picture_frame_02': 'c218f5eed3aeaeeee91d36f4dc32740a',
    'industrial_wall_lamp': 'fad803ed23fad9b363d58c51639d971a',
    'side_table_01': '2a756d4b66fde82d47128447a974e721',
    'ceramic_vase_01': '98390349d15e8312ee4b2cabd71acac4',
}
FRONT_WALL_Y = 6.30  # inside face of the wall behind the product
# Staging stays outside this x range, so the widest product (300 cm) fits on the rug.
PRODUCT_ZONE_X = (0.15, 3.45)
SCONCE_XS = (0.05, 3.55)


def args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    opts = {}
    for i, a in enumerate(argv):
        if a.startswith('--') and i + 1 < len(argv):
            opts[a[2:]] = argv[i + 1]
    return opts


def fetch(name, md5):
    path = os.path.join(RAW, name)
    if os.path.exists(path) and hashlib.md5(open(path, 'rb').read()).hexdigest() == md5:
        return path
    os.makedirs(RAW, exist_ok=True)
    data = http_get(FLOOR_URL + name)
    if hashlib.md5(data).hexdigest() != md5:
        raise SystemExit(f'{name}: checksum mismatch')
    open(path, 'wb').write(data)
    return path


def http_get(url):
    # Poly Haven's API rejects Python's default user agent.
    request = urllib.request.Request(url, headers={'User-Agent': 'twirl-room-pipeline/1.0'})
    return urllib.request.urlopen(request).read()


def download(url, path, md5):
    if os.path.exists(path) and hashlib.md5(open(path, 'rb').read()).hexdigest() == md5:
        return
    data = http_get(url)
    if hashlib.md5(data).hexdigest() != md5:
        raise SystemExit(f'{url}: checksum mismatch')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(data)


def fetch_model(model_id):
    """Downloads a Poly Haven model at 2k into raw/models/<id>/ and returns its .gltf path."""
    info = json.loads(http_get(f'https://api.polyhaven.com/files/{model_id}'))
    gltf = info['gltf']['2k']['gltf']
    if gltf['md5'] != STAGING_MODELS[model_id]:
        raise SystemExit(f'{model_id}: the source changed on Poly Haven (new MD5)')
    folder = os.path.join(RAW, 'models', model_id)
    path = os.path.join(folder, f'{model_id}_2k.gltf')
    download(gltf['url'], path, gltf['md5'])
    for rel, entry in gltf['include'].items():
        download(entry['url'], os.path.join(folder, rel), entry['md5'])
    return path


def bounds(objects):
    pts = [o.matrix_world @ Vector(c) for o in objects if o.type == 'MESH' for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def import_model(path, col):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for obj in new:
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        col.objects.link(obj)
    bpy.context.view_layer.update()
    return new


def move(objects, offset):
    for obj in objects:
        if obj.parent is None:
            obj.location += offset
    bpy.context.view_layer.update()


def place(objects, x, y=None, floor=None, centre_z=None, back_to_wall=None):
    """Moves imported objects so their bounds are centred on x (and y), standing on `floor`
    or centred at `centre_z`, and, with `back_to_wall`, touching that wall (y) from the room side."""
    lo, hi = bounds(objects)
    centre = (lo + hi) / 2
    dz = (floor - lo.z) if floor is not None else (centre_z - centre.z)
    dy = (back_to_wall - hi.y) if back_to_wall is not None else (y - centre.y)
    move(objects, Vector((x - centre.x, dy, dz)))
    return bounds(objects)


def principled(name, color, roughness, specular=0.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Specular IOR Level'].default_value = specular
    return mat


def srgb(hexstr):
    """'#rrggbb' to linear RGB."""
    c = [int(hexstr[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def planar_uv(obj, size):
    """World-space top/front projection UVs, `size` metres per UV unit."""
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    uv = bm.loops.layers.uv.verify()
    for face in bm.faces:
        n = face.normal
        for loop in face.loops:
            p = obj.matrix_world @ loop.vert.co
            if abs(n.z) > 0.5:
                loop[uv].uv = (p.x / size, p.y / size)
            elif abs(n.x) > 0.5:
                loop[uv].uv = (p.y / size, p.z / size)
            else:
                loop[uv].uv = (p.x / size, p.z / size)
    bm.to_mesh(mesh)
    bm.free()


# ── clean-up ──────────────────────────────────────────────────────────────────────────────

# Brand logos baked into appliance textures (Bosch on the stove, ConServ on the fridge).
LOGO_IMAGES = ('BOSCH', 'SIMBOLO')


def remove_logos():
    """Replaces every brand-logo texture with plain brushed steel."""
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        for node in list(mat.node_tree.nodes):
            if node.type == 'TEX_IMAGE' and node.image and any(
                key in node.image.name.upper() for key in LOGO_IMAGES
            ):
                for link in list(node.outputs[0].links):
                    mat.node_tree.links.remove(link)
                bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = (0.55, 0.56, 0.57, 1)
                    bsdf.inputs['Metallic'].default_value = 1.0
                    bsdf.inputs['Roughness'].default_value = 0.35
                mat.node_tree.nodes.remove(node)
                print(f'removed logo texture from {mat.name}')


def clear_product_spot():
    for name in ('LivingRoom_Chair_Round',):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def seal_room():
    """The walls are single planes with gaps at their edges, so outside light leaks in along the
    skirting. Give them thickness (outward) and extend the floor and ceiling beneath them."""
    centre = bpy.data.objects['Room_Floor'].location.copy()
    for name in ('Wall_Back', 'Wall_Front', 'Wall_Left', 'Wall_Right'):
        obj = bpy.data.objects[name]
        lo, hi = bounds([obj])
        axis = 0 if hi.x - lo.x < hi.y - lo.y else 1  # the wall's thin axis
        inner = lo[axis] if centre[axis] < lo[axis] else hi[axis]
        mod = obj.modifiers.new('Thickness', 'SOLIDIFY')
        mod.thickness = 0.2
        mod.offset = 1
        # Measure the thickened wall; if it grew into the room, grow it the other way.
        bpy.context.view_layer.update()
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        pts = [evaluated.matrix_world @ Vector(c) for c in evaluated.bound_box]
        towards_room = min(p[axis] for p in pts) if centre[axis] < inner else max(p[axis] for p in pts)
        if abs(towards_room - inner) > 0.01:
            mod.offset = -1
    for name in ('Room_Floor', 'Room_Ceiling'):
        obj = bpy.data.objects[name]
        obj.scale = (obj.scale.x * 1.08, obj.scale.y * 1.08, obj.scale.z)


def let_sun_through_glass():
    """Cycles: glass casts no shadow, so daylight reaches the room (and renders without noise)."""
    for obj in bpy.data.objects:
        if obj.name not in ('Window', 'Door_Sliding'):
            continue
        for slot in obj.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes:
                continue
            nodes, links = mat.node_tree.nodes, mat.node_tree.links
            out = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
            bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if not bsdf or bsdf.inputs['Transmission Weight'].default_value < 0.5:
                continue
            path = nodes.new('ShaderNodeLightPath')
            clear = nodes.new('ShaderNodeBsdfTransparent')
            mix = nodes.new('ShaderNodeMixShader')
            links.new(path.outputs['Is Shadow Ray'], mix.inputs['Fac'])
            links.new(bsdf.outputs[0], mix.inputs[1])
            links.new(clear.outputs[0], mix.inputs[2])
            links.new(mix.outputs[0], out.inputs['Surface'])
            print(f'glass passes light: {mat.name}')


# ── finishes ──────────────────────────────────────────────────────────────────────────────

def finishes():
    walls = principled('Room_WallPaint', srgb('#e9e3d9'), 0.9, 0.3)
    ceiling = principled('Room_Ceiling', srgb('#f3f1ec'), 0.95, 0.2)
    for name in ('Wall_Back', 'Wall_Front', 'Wall_Left', 'Wall_Right'):
        obj = bpy.data.objects[name]
        assign(obj, walls)
        planar_uv(obj, 2.0)
    assign(bpy.data.objects['Room_Ceiling'], ceiling)
    planar_uv(bpy.data.objects['Room_Ceiling'], 2.0)

    floor = bpy.data.materials.new('Room_FloorOak')
    floor.use_nodes = True
    nt = floor.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tex = {k: nt.nodes.new('ShaderNodeTexImage') for k in FLOOR}
    for key, node in tex.items():
        node.image = bpy.data.images.load(fetch(*FLOOR[key]))
        if key != 'diff':
            node.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(tex['diff'].outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(tex['rough'].outputs['Color'], bsdf.inputs['Roughness'])
    normal = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(tex['nor'].outputs['Color'], normal.inputs['Color'])
    nt.links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
    obj = bpy.data.objects['Room_Floor']
    assign(obj, floor)
    planar_uv(obj, FLOOR_TILE_M)


# ── staging: a plant, framed art between two sconces, a side table with a vase ────────────

SCONCES = []  # bulb positions, filled by stage(); lit by both rigs


def artwork(width=1200, height=800):
    """An original abstract print (our own, so no licence to track): a terracotta arch, a sage
    sun and a navy line on warm paper, matching the room's palette."""
    import numpy as np

    y, x = np.mgrid[0:height, 0:width].astype(np.float32)
    x /= height
    y /= height  # unit = image height; origin top-left
    img = np.ones((height, width, 3), np.float32) * np.array([0.937, 0.906, 0.855])

    def paint(mask, hexstr):
        img[mask] = [int(hexstr[i:i + 2], 16) / 255 for i in (1, 3, 5)]

    # Arch: a semicircle on a rectangle, standing on the lower third.
    cx, top, r = 0.62, 0.30, 0.22
    paint(((x - cx) ** 2 + (y - (top + r)) ** 2 < r ** 2) & (y < top + r)
          | ((abs(x - cx) < r) & (y >= top + r) & (y < 0.82)), '#b5603a')
    paint((x - 1.02) ** 2 + (y - 0.33) ** 2 < 0.11 ** 2, '#8fa58a')  # sun
    paint((abs(y - 0.86) < 0.006) & (x > 0.18) & (x < 1.32), '#2b3a55')  # horizon line
    paint((x - 0.30) ** 2 + (y - 0.62) ** 2 < 0.035 ** 2, '#d8a548')  # small mustard dot
    # Paper grain, so it reads as a print rather than a flat screen.
    rng = np.random.default_rng(7)
    img *= 1 + rng.normal(0, 0.012, (height, width, 1)).astype(np.float32)
    rgba = np.concatenate([np.clip(img, 0, 1), np.ones((height, width, 1), np.float32)], 2)
    image = bpy.data.images.new('Twirl_Artwork', width, height)
    image.colorspace_settings.name = 'sRGB'
    image.pixels.foreach_set(np.flipud(rgba).astype(np.float32).ravel())  # rows bottom-up
    image.pack()
    return image


def clear_frame_glass():
    """The frame's glass ships opaque, hiding the print: make it clear with a faint sheen."""
    mat = bpy.data.materials['hanging_picture_frame_02_glass']
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    for link in list(bsdf.inputs['Alpha'].links) + list(bsdf.inputs['Base Color'].links):
        mat.node_tree.links.remove(link)
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['Roughness'].default_value = 0.05
    bsdf.inputs['Alpha'].default_value = 0.08
    mat.surface_render_method = 'BLENDED'


def hang_artwork():
    clear_frame_glass()
    mat = bpy.data.materials.get('hanging_picture_frame_02_artwork')
    for node in mat.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image and 'artwork_diff' in node.image.name:
            node.image = artwork()
            return
    raise SystemExit('artwork texture node not found')


def stage():
    col = collection('Staging')
    place(import_model(fetch_model('potted_plant_01'), col), -0.72, 5.85, floor=0.0)
    place(import_model(fetch_model('hanging_picture_frame_02'), col), 1.8, centre_z=1.5,
          back_to_wall=FRONT_WALL_Y)
    hang_artwork()
    for x in SCONCE_XS:
        lo, hi = place(import_model(fetch_model('industrial_wall_lamp'), col), x, centre_z=1.72,
                       back_to_wall=FRONT_WALL_Y)
        # The bulb sits in the shade, out from the wall.
        SCONCES.append(Vector(((lo.x + hi.x) / 2, lo.y + 0.06, (lo.z + hi.z) / 2 - 0.04)))
    lo, hi = place(import_model(fetch_model('side_table_01'), col), 3.95, 5.6, floor=0.0)
    place(import_model(fetch_model('ceramic_vase_01'), col), 3.95, 5.6, floor=hi.z)
    for obj in col.objects:
        if obj.type == 'MESH':
            lo, hi = bounds([obj])
            assert hi.x < PRODUCT_ZONE_X[0] or lo.x > PRODUCT_ZONE_X[1] or lo.z > 1.2, obj.name


# ── lighting: two rigs, toggled by render.py / bake.py ────────────────────────────────────

def collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def light(col, name, kind, location, energy, kelvin, **kw):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    data.use_temperature = True
    data.temperature = kelvin
    for key, value in kw.items():
        setattr(data, key, value)
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    col.objects.link(obj)
    return obj


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def world(name, color, strength):
    w = bpy.data.worlds.new(name)
    w.use_fake_user = True  # kept in the file although only one is active at a time
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*color, 1)
    bg.inputs['Strength'].default_value = strength
    return w


def lighting():
    day = collection('Lights_Day')
    # Low afternoon sun from the west: through the window it lays a warm patch on the floor
    # beside the product.
    sun = light(day, 'Sun', 'SUN', (-6, 4.9, 3.6), 14.0, 4800, angle=math.radians(0.8))
    aim(sun, (0.55, 4.75, 0.0))
    # Skylight through the window: soft, cool light that fills the room as daylight does.
    sky = light(day, 'Window_Skylight', 'AREA', (-1.15, 4.99, 1.6), 110, 6800,
                shape='RECTANGLE', size=1.6, size_y=1.45)
    aim(sky, (3.0, 4.99, 1.0))
    # Light bouncing back off the opposite side of the open-plan room.
    bounce = light(day, 'Room_Bounce', 'AREA', (2.15, 2.45, 2.55), 40, 6000, size=4.0)
    aim(bounce, (2.15, 2.45, 0))
    # A few lamps already on: the sconces and the dining pendant, low and warm.
    for i, bulb in enumerate(SCONCES):
        light(day, f'Sconce_Day_{i + 1}', 'POINT', bulb, 10, 2900, shadow_soft_size=0.04)
    light(day, 'Pendant_Day', 'POINT', (3.30, 0.80, 2.18), 25, 3000, shadow_soft_size=0.08)
    bpy.context.scene.world = world('World_Day', (0.62, 0.74, 0.95), 1.1)

    night = collection('Lights_Night')
    # Recessed downlights over the living area, warm white (not orange).
    for i, (x, y) in enumerate([(1.0, 3.8), (2.6, 3.8), (1.0, 5.4), (2.6, 5.4)]):
        spot = light(night, f'Downlight_{i + 1}', 'SPOT', (x, y, 2.66), 45, 3300,
                     spot_size=math.radians(80), spot_blend=0.9, shadow_soft_size=0.04)
        aim(spot, (x, y, 0))
    # The wall sconces either side of the art, and the dining pendant.
    for i, bulb in enumerate(SCONCES):
        light(night, f'Sconce_Night_{i + 1}', 'POINT', bulb, 30, 2900, shadow_soft_size=0.04)
    light(night, 'Pendant_Glow', 'POINT', (3.30, 0.80, 2.18), 60, 3000, shadow_soft_size=0.08)
    # Soft neutral fill so corners don't fall to black.
    fill = light(night, 'Ceiling_Fill', 'AREA', (2.15, 2.45, 2.6), 45, 3600, size=3.0)
    aim(fill, (2.15, 2.45, 0))
    # Blue hour outside: a cool counterpoint to the warm lamps.
    world('World_Night', (0.02, 0.03, 0.07), 1.0)


def place_product(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    col = collection('Product')
    for obj in new:
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        col.objects.link(obj)
        if obj.parent is None:
            obj.location = PRODUCT_SPOT
    print(f'placed product ({len(new)} objects)')


def main():
    opts = args()
    bpy.ops.file.make_paths_absolute()
    remove_logos()
    clear_product_spot()
    seal_room()
    let_sun_through_glass()
    finishes()
    stage()
    lighting()
    if opts.get('product'):
        place_product(opts['product'])
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'room.blend'), copy=True)
    print('saved', os.path.join(OUT, 'room.blend'))


main()
