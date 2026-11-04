"""Realistyczne ikony w stylu Apple (liquid glass) — generator płytek PNG.

Jedna, dopracowana płytka `plate.png` (512 px, supersampling x2):
  • superelipsa (squircle, n≈5) — dokładnie jak maska iOS,
  • szeroki, miękki refleks górny (jakby światło padało z góry),
  • sierpowy błysk (specular) przy górnej-lewej krawędzi,
  • jasny „rim” (grubość szkła) + rozszczepienie chromatyczne na krawędzi,
  • cień wewnętrzny u dołu i po bokach (ambient occlusion / grubość materiału),
  • soczewka rozświetlająca dolny obszar,
  • bardzo delikatne ziarno (usuwa pasma gradientu).

Płytka jest biało-przezroczysta: kolor marki (gradient) leży POD nią w CSS,
więc szkło realnie go załamuje i rozjaśnia.
"""
from PIL import Image
import numpy as np
import os

OUT = "assets/icons/plate.png"
SIZE = 512
SS = 2
N = 5.0

def build():
    s = SIZE * SS
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    c = (s - 1) / 2.0
    x = (xx - c) / c
    y = (yy - c) / c

    # superelipsa: r = 0 w środku, 1 na krawędzi
    r = (np.abs(x) ** N + np.abs(y) ** N) ** (1.0 / N)
    mask = np.clip((1.0 - r) / (1.2 / s), 0, 1)          # antyaliasing

    g = lambda d, w: np.exp(-((d / w) ** 2))              # gauss

    # --- 1. podstawa szkła: bardzo delikatna, tylko górna część jaśniejsza ---
    base = 0.035 + 0.10 * np.clip(1.0 - (y + 1) / 2 * 1.4, 0, 1) ** 1.6

    # --- 2. szeroki refleks górny (miękki, „sufit”) ---
    top_glow = g(y + 0.88, 0.40) * np.clip(1.0 - np.abs(x) * 0.40, 0, 1) * 0.14

    # --- 3. sierpowy błysk przy górnej-lewej krawędzi ---
    crescent = g(r - 0.885, 0.055) * np.clip(-(y + 0.10) * 1.9, 0, 1) \
               * np.clip(-x * 0.90 + 0.45, 0, 1) ** 0.9 * 0.85

    # --- 4. drobny, ostry błysk punktowy ---
    spark = g(np.sqrt((x + 0.44) ** 2 + (y + 0.50) ** 2), 0.13) * 0.70

    # --- 5. rim: jasna krawędź szkła ---
    rim = g(r - 0.962, 0.018) * 1.05
    rim_top = rim * np.clip(1.35 - (y + 1) * 0.55, 0, 1)     # mocniejszy u góry
    rim_bottom = rim * np.clip((y + 0.1) * 0.9, 0, 1)

    # --- 6. cień wewnętrzny (grubość szkła, dół i boki) ---
    inner = g(r - 0.82, 0.085) * np.clip((y - 0.10) * 2.0, 0, 1) * 0.46
    side = g(r - 0.88, 0.09) * np.clip(np.abs(x) - 0.45, 0, 1) * 0.22

    # --- 7. soczewka: rozświetlenie dolnej części ---
    lens = g(np.sqrt((x * 1.9) ** 2 + ((y - 0.72) * 1.25) ** 2), 0.34) * 0.16

    # --- 8. refrakcja / rozszczepienie przy krawędzi ---
    edge_band = g(r - 0.947, 0.030)
    disp = np.zeros((s, s, 3), np.float32)
    for i, (dx, dy) in enumerate(((-0.010, -0.008), (0.0, 0.0), (0.010, 0.008))):
        shifted = np.roll(np.roll(edge_band, int(dy * s), axis=0), int(dx * s), axis=1)
        disp[..., i] = shifted * (0.55 if i != 1 else 0.18)

    # --- alfa ---
    alpha = (base + top_glow + crescent * 0.85 + spark * 0.65 + rim_top * 0.85
             + rim_bottom * 0.35 + lens + edge_band * 0.10 - inner - side)
    alpha = np.clip(alpha, 0, 1) * mask

    # --- kolor (białe szkło z lekkim chłodem) ---
    rgb = np.zeros((s, s, 3), np.float32)
    tints = (255.0, 255.0, 255.0)
    for i in range(3):
        col = np.full((s, s), tints[i], np.float32)
        col *= (1.0 + crescent * 0.12 + spark * 0.18 + rim_top * 0.10 + lens * 0.08)
        col *= (1.0 - inner * 0.55 - side * 0.5)
        col += disp[..., i] * 110.0
        rgb[..., i] = np.clip(col, 0, 255)

    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA").resize((SIZE, SIZE), Image.LANCZOS)

    # ziarno
    a = np.array(img).astype(np.float32)
    noise = np.random.default_rng(23).normal(0, 1.7, (SIZE, SIZE, 1))
    a[..., :3] = np.clip(a[..., :3] + noise, 0, 255)
    img = Image.fromarray(a.astype(np.uint8), "RGBA")
    img.save(OUT, optimize=True)
    print(f"{OUT}: {os.path.getsize(OUT)/1024:.1f} KB  {img.size}")

    # maska squircle (kryta w środku) — do podglądów i przycinania koloru
    m = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
    mask_img = Image.fromarray(np.dstack([m, m, m, m]), "RGBA").resize((SIZE, SIZE), Image.LANCZOS)
    mask_img.save("assets/icons/mask.png", optimize=True)
    print(f"assets/icons/mask.png: {os.path.getsize('assets/icons/mask.png')/1024:.1f} KB")

if __name__ == "__main__":
    build()
