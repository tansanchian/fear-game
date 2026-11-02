"""Build hallucination montages from the game's existing local audio (requires ffmpeg).

Each source is balanced before the stereo mix. Final target: -18 LUFS, -2 dBTP,
44.1 kHz stereo MP3. Runtime playback gains are in memory-atmosphere.js.
"""
from pathlib import Path
import subprocess

ASSETS = Path(__file__).resolve().parents[1] / 'assets'
# Source, trim start, duration, gain, left/right placement, delay, pitch, reverse.
MIXES = {
    'voices': (5.4, [
        ('electrical-buzz', 0, 5.4, .32, .55, .55, 0, 1, False),
        ('behind-door-voices', .3, 4.1, .80, .95, .25, .3, .96, False),
        ('behind-door-voices', 5.25, .8, .75, .20, .95, 4.1, 1, False),
    ]),
    'laughter': (5.6, [
        ('children-laughter', .3, 3.5, .78, .25, .95, 0, .91, False),
        ('memory-footsteps', .1, 3.5, .82, .90, .30, 1.0, 1, False),
        ('children-laughter', 2.0, .9, .40, .85, .20, 4.0, 1, True),
    ]),
    'chant': (5.8, [
        ('door-chant', .8, 4.5, .85, .85, .45, 0, .97, False),
        ('electrical-buzz', 0, 5.3, .35, .35, .85, .2, .94, False),
        ('behind-door-voices', 4.3, 1.8, .60, .25, .95, 3.5, 1, False),
    ]),
    'echo': (5.0, [
        ('children-laughter', 2, 1.3, .70, .90, .20, 0, .94, True),
        ('behind-door-voices', 1.5, 2.0, .65, .15, .95, 1.0, .96, False),
        ('memory-radio', .8, 2.3, .55, .70, .40, 1.8, 1, False),
        ('behind-door-voices', 5.3, .6, .65, .45, .85, 4.1, 1, False),
    ]),
}

for name, (duration, sources) in MIXES.items():
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y']
    filters = []
    for index, (source, start, length, gain, left, right, delay, pitch, reverse) in enumerate(sources):
        command += ['-i', str(ASSETS / f'{source}.mp3')]
        chain = [f'atrim=start={start}:duration={length}', 'asetpts=PTS-STARTPTS',
                 'aresample=44100', 'aformat=channel_layouts=mono']
        if reverse:
            chain.append('areverse')
        if pitch != 1:
            chain += [f'asetrate={round(44100 * pitch)}', 'aresample=44100']
        chain += ['highpass=f=100', 'lowpass=f=3400', 'loudnorm=I=-22:TP=-4:LRA=7',
                  'aresample=44100', f'volume={gain}', 'afade=t=in:d=0.09',
                  f'afade=t=out:st={max(.1, length / pitch - .3)}:d=0.3',
                  f'pan=stereo|c0={left}*c0|c1={right}*c0',
                  f'adelay={round(delay * 1000)}:all=1']
        filters.append(f'[{index}:a]' + ','.join(chain) + f'[s{index}]')
    inputs = ''.join(f'[s{i}]' for i in range(len(sources)))
    filters.append(inputs + f'amix=inputs={len(sources)}:normalize=0:dropout_transition=0,'
                   f'apad,atrim=duration={duration},loudnorm=I=-18:TP=-2:LRA=7,'
                   'aresample=44100,alimiter=limit=0.89:level=false,'
                   f'afade=t=in:d=0.18,afade=t=out:st={duration - .65}:d=0.65[mix]')
    command += ['-filter_complex', ';'.join(filters), '-map', '[mix]',
                '-ar', '44100', '-ac', '2', '-codec:a', 'libmp3lame', '-b:a', '160k',
                str(ASSETS / f'memory-mix-{name}.mp3')]
    subprocess.run(command, check=True)
    print(f'Built memory-mix-{name}.mp3 ({duration}s)')
