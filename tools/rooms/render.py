"""Preview renders of the prepared room (out/room.blend) in day or night lighting.

  blender -b out/room.blend --python render.py -- --lighting day --view hero --width 1280
Writes out/preview-<lighting>-<view>.png.
"""

import bpy
import os
import sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
VIEWS = {
    # Standing in the room, looking at the product on the rug, the window behind it on the left.
    'hero': {'at': (3.95, 2.45, 1.3), 'look': (1.65, 4.85, 0.5), 'lens': 26},
    # From the dining corner across the whole open-plan room.
    'overview': {'at': (5.25, -0.95, 1.9), 'look': (1.4, 4.2, 0.6), 'lens': 20},
    # Diagnostic: straight down on the living area, to see where light falls.
    'top': {'at': (1.4, 4.4, 6.0), 'look': (1.4, 4.41, 0.0), 'lens': 18},
}
EXPOSURE = {'day': 0.0, 'night': 0.6}


def opts():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    return {argv[i][2:]: argv[i + 1] for i in range(0, len(argv) - 1, 2)}


def main():
    o = opts()
    lighting, view = o.get('lighting', 'day'), o.get('view', 'hero')
    width = int(o.get('width', 1280))
    s = bpy.context.scene
    for name, col in (('day', 'Lights_Day'), ('night', 'Lights_Night')):
        bpy.data.collections[col].hide_render = name != lighting
    s.world = bpy.data.worlds['World_Day' if lighting == 'day' else 'World_Night']

    cam = bpy.data.objects.new('Preview', bpy.data.cameras.new('Preview'))
    s.collection.objects.link(cam)
    v = VIEWS[view]
    cam.location = v['at']
    cam.rotation_euler = (Vector(v['look']) - Vector(v['at'])).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = v['lens']
    cam.data.clip_start = 0.05
    s.camera = cam

    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = int(o.get('samples', 96))
    s.cycles.use_adaptive_sampling = True
    s.cycles.use_denoising = True
    s.cycles.max_bounces = 8
    s.cycles.sample_clamp_indirect = 8
    s.render.resolution_x = width
    s.render.resolution_y = round(width * 9 / 16)
    s.render.resolution_percentage = 100
    s.view_settings.view_transform = 'AgX'
    s.view_settings.look = 'None'
    s.view_settings.exposure = EXPOSURE[lighting]
    s.render.filepath = os.path.join(HERE, 'out', f'preview-{lighting}-{view}.png')
    bpy.ops.render.render(write_still=True)
    print('wrote', s.render.filepath)


main()
