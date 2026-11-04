"""Realistyczne szklane płytki ikon (liquid glass, styl Apple).

Płytka = przezroczysty PNG: superelipsa (squircle), czyste szkło z delikatnym
tintem, wyraźny jasny „rim” na krawędzi, cień wewnętrzny u dołu (grubość szkła),
refleks w kształcie sierpa w lewym górnym rogu, pasmo refrakcji z tęczą u dołu.
Kolor marki kładziemy POD płytką (CSS: ::before z currentColor).
"""
from PIL import Image
import numpy as np
import os

SIZE = 256
SS = 3                      # supersampling
N = 4.6                     # wykładnik superelipsy

def field(size):
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    c = (size - 1) / 2.0
    x = (xx - c) / c
    y = (yy - c) / c
    r = (np.abs(x) ** N + np.abs(y) ** N) ** (1.0 / N)     # 0 w środku, 1 na krawędzi
    return r, x, y, c

def sig(t, w):           # gładka „gaussowa” funkcja odległości
    return np.exp(-((t / w) ** 2))

def plate(path, clarity=1.0, gloss=1.0, disp=1.0, tint=(255, 255, 255)):
    size = SIZE * SS
    r, x, y, c = field(size)

    # maska (antyaliasing na krawędzi)
    mask = np.clip((1.0 - r) / (1.6 / size), 0, 1)

    # ---- szkło: podstawa ----
    # jasność rośnie ku górze, delikatnie ciemniej przy dolnej krawędzi
    vert = np.clip((0.62 - (y + 1) / 2 * 0.52), 0, 1)
    base = vert * (0.30 * clarity)

    # ---- refleks w kształcie sierpa przy górnej/lewej krawędzi ----
    crescent = sig(r - 0.80, 0.11) * np.clip(-(y - 0.05) * 1.1, 0, 1) * np.clip(-x * 0.55 + 0.65, 0, 1)
    # ---- błysk punktowy ----
    spark = sig(np.sqrt((x + 0.36) ** 2 + (y + 0.44) ** 2), 0.20) * 0.95
    # ---- rozświetlenie „soczewki” u dołu (światło skupione w szkle) ----
    lens = sig(np.sqrt((x * 1.6) ** 2 + ((y - 0.62) * 1.25) ** 2), 0.42) * 0.42
    # ---- cienki, jasny rim (krawędź szkła) ----
    rim = sig(r - 0.965, 0.020) * 1.0
    # ---- cień wewnętrzny u dołu (grubość szkła) ----
    inner_shadow = sig(r - 0.86, 0.09) * np.clip((y - 0.15) * 1.6, 0, 1)

    # ---- pasmo refrakcji (tęcza) ----
    band = sig(y - 0.62, 0.055) * np.clip(1 - np.abs(x) / 0.86, 0, 1)
    disp_rgb = np.zeros((size, size, 3), np.float32)
    for i, off in enumerate((-0.028, 0.0, 0.028)):
        disp_rgb[..., i] = np.roll(band, int(off * size), axis=0) * (0.60 if i != 1 else 0.25) * disp

    # ---- alfa ----
    alpha = base + crescent * 0.55 * gloss + spark * 0.75 * gloss + lens * 0.30 \
            + rim * 0.72 + band * 0.16 - inner_shadow * 0.22
    alpha = np.clip(alpha, 0, 1) * mask

    # ---- kolor ----
    rgb = np.zeros((size, size, 3), np.float32)
    for i in range(3):
        col = np.full((size, size), float(tint[i]))
        col = col * (1 + crescent * 0.10 + spark * 0.22 + rim * 0.18 + lens * 0.12)
        col = col * (1 - inner_shadow * 0.35)
        col = col + disp_rgb[..., i] * 255 * 1.05     # refrakcja dodaje barwę
        rgb[..., i] = np.clip(col, 0, 255)

    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA").resize((SIZE, SIZE), Image.LANCZOS)

    # ziarno
    a = np.array(img).astype(np.float32)
    n = np.random.default_rng(11).normal(0, 2.0, (SIZE, SIZE, 1))
    a[..., :3] = np.clip(a[..., :3] + n, 0, 255)
    Image.fromarray(a.astype(np.uint8), "RGBA").save(path, optimize=True)
    print(f"{path}: {os.path.getsize(path)/1024:.1f} KB")

plate("assets/icons/plate-light.png", clarity=1.00, gloss=1.00, disp=1.00)
plate("assets/icons/plate-clear.png", clarity=0.70, gloss=0.95, disp=1.25)
plate("assets/icons/plate-deep.png",  clarity=1.20, gloss=0.80, disp=0.55, tint=(238, 244, 255))
