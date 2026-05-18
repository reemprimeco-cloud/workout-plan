// exerciseTranslations.ts
// Utility to translate Arabic exercise data strings (defaultReps, defaultWeight) to English

const weightMap: Record<string, string> = {
  'وزن الجسم': 'Bodyweight',
  '2 كجم': '2 kg',
  '2 كجم لكل يد': '2 kg each',
  '3 كجم': '3 kg',
  '3 كجم لكل يد': '3 kg each',
  '4 كجم لكل يد': '4 kg each',
  '5 كجم': '5 kg',
  '5 كجم لكل يد': '5 kg each',
  '8 كجم': '8 kg',
  '8 كجم لكل يد': '8 kg each',
  '10 كجم': '10 kg',
  '15 كجم': '15 kg',
  '20 كجم': '20 kg',
  '30 كجم': '30 kg',
  '—': '—',
};

const repsMap: Record<string, string> = {
  '10 دورات': '10 rounds',
  '10 لكل اتجاه': '10 each side',
  '10 لكل جهة': '10 each side',
  '10 لكل ساق': '10 each leg',
  '100 ضربة': '100 beats',
  '12 لكل رجل': '12 each leg',
  '12 لكل ساق': '12 each leg',
  '12 لكل يد': '12 each hand',
  '15 دقيقة': '15 min',
  '15 لكل رجل': '15 each leg',
  '15 لكل ساق': '15 each leg',
  '15 لكل يد': '15 each hand',
  '15 للأمام + 15 للخلف': '15 fwd + 15 back',
  '20 لكل جهة': '20 each side',
  '25 ثانية لكل جهة': '25 sec each side',
  '30 ثانية': '30 sec',
  '30 ثانية لكل جهة': '30 sec each side',
  '30 ثانية لكل ذراع': '30 sec each arm',
  '30 ثانية لكل ساق': '30 sec each leg',
  '5 لكل جهة': '5 each side',
  '60 ثانية': '60 sec',
  '60 ثانية لكل جهة': '60 sec each side',
};

/**
 * Translate an Arabic defaultWeight string to English.
 * Falls back to the original string if no translation found.
 */
export function translateWeight(value: string): string {
  return weightMap[value] ?? value;
}

/**
 * Translate an Arabic defaultReps string to English.
 * Falls back to the original string if no translation found.
 */
export function translateReps(value: string): string {
  return repsMap[value] ?? value;
}
