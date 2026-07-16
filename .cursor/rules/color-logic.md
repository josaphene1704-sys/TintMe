# TintMe - Hair Color Formula Rules

This document outlines the professional logic for calculating hair dye formulas based on current hair state, target shade, and diagnostic answers.

## 1. Gray Hair Coverage Rules (Based on Gray Percentage Question)
- 0% Gray: 100% Target Fashion Shade. No base tone needed.
- Up to 30% Gray: 100% Target Fashion Shade (or optional 1/4 Natural Base if hair is resistant).
- 30% - 50% Gray: Mix 1/3 Natural Base (0 series) + 2/3 Target Fashion Shade in the same level.
- Over 50% Gray: Mix 1:1 Ratio - 50% Natural Base (0 or 00 series) + 50% Target Fashion Shade.
## 2. Subtle Lift Brightening Rule (Lifting 1–2 Levels)
- When the target shade is 1 or 2 levels lighter than the current hair (less than 3 levels difference), add Natural Lightener (0 or 00 series at the same level) at a 1:1 ratio with the fashion shade.
  * Split the fashion shade amount equally: half fashion shade + half natural lightener.
  * Example: if 60g of fashion shade is needed → use 30g Fashion Shade + 30g Natural Lightener (0/00 series).
  * This rule applies BEFORE hair-length scaling — scale the resulting combined color amount as usual.
  * Developer remains 6% for this range (not high-lift).
  * Do NOT apply this rule when: lifting 3+ levels (use High-Lift logic instead), dyeing same level or darker, or when gray coverage rules already dictate a natural base mix.

## 3. Mixing Ratios & Developer (Oxygen) Rules
- Standard Color Logic (Dyeing same level / Darker / Gray coverage):
  * Mixing Ratio: 1:1 (e.g., 60g Target Color + 60g Developer = 120g total mixture).
  * Developer: 3% or 6% based on gray hair and depth.
- High-Lift / Bleaching Logic (Lifting 3+ Levels):
  * Mixing Ratio: 1:2 — Developer amount is ALWAYS double the bleach/color powder amount (e.g., 40g Bleach Powder + 80g Developer = 120g total mixture).
  * Developer strength depends on hair history — CRITICAL RULE:
    - 12% Developer: ONLY for natural, healthy hair (never colored, never bleached, not damaged).
    - 9% Developer: for previously COLORED hair that needs a 3-level lift. NEVER apply 12% over colored hair.
    - The 1:2 mixing ratio (developer double the powder) is mandatory for BOTH strengths when mixing with bleach powder.
  * Display a special warning for precise application, stating the exact developer strength chosen (12% natural-only / 9% colored hair).

## 4. Hair Length Scaling (Question 4 in Diagnostic)
Hair Length is the 4th diagnostic question and scales ALL gram amounts proportionally.
- Short / Normal (up to shoulders): Baseline gram values apply (see sections 1–2).
  * Standard example: 60g Target Color + 60g Developer = 120g total.
  * High-Lift example: 40g Target Color + 80g Developer = 120g total.
- Long (below shoulders): ALL baseline gram amounts are doubled automatically.
  * Standard example: 120g Target Color + 120g Developer = 240g total.
  * High-Lift example: 80g Target Color + 160g Developer = 240g total.
  * Gray-coverage mixes are doubled the same way (e.g. 30%–50% gray long hair: 80g target + 40g base + 120g developer = 240g).
- Display a badge on the results screen confirming the auto-scaling: "הכמויות הוכפלו אוטומטית לשיער ארוך" / "הכמויות מותאמות לשיער קצר / בינוני".

## 5. Timing & Application Adjustments (Based on Condition & Bleaching)
- Natural Hair: Standard processing time of 35-45 minutes.
- Regular / Colored Hair: Apply to roots first (full time), stretch to ends only for the last 10-15 minutes to refresh color.
- Damaged / Dry Hair: 
  * Reduce overall processing time by 5-10 minutes.
  * Recommend lower developer volume on ends (or ammonia-free toner) to preserve hair integrity.
- Bleached recently: 
  * WARNING: Do not apply permanent color with high developer over recently bleached areas.
  * Recommend a low-volume Toner (1.9% or 3%) for those sections.