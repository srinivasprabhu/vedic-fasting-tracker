/**
 * “Did you know?” story slides — wellness education only, not medical advice.
 * Hero areas use gradient pairs as abstract visuals (swap for bundled stock images later).
 */

export interface DidYouKnowSlide {
  id: string;
  /** Short label over the hero (e.g. “Fasting!”) */
  topTitle: string;
  headline: string;
  body: string;
  /** Abstract gradient — [topLeft-ish, bottomRight-ish] */
  gradient: [string, string];
}

export const DID_YOU_KNOW_SLIDES: DidYouKnowSlide[] = [
  {
    id: 'timer',
    topTitle: 'Getting started',
    headline: 'Set your fasting rhythm',
    body:
      'Your cycle starts with a single tap. Begin the timer after your last meal — small rituals build the habits that change how you feel over weeks and months.',
    gradient: ['#FFF9E8', '#FFD9A8'],
  },
  {
    id: 'hydration',
    topTitle: 'Fasting!',
    headline: 'Break from eating, keep drinking',
    body:
      'Water, plain tea, and black coffee are your allies. Avoid calories during the fast so your body can shift gears and rest the digestive system.',
    gradient: ['#E8F2FF', '#B8D4F0'],
  },
  {
    id: 'metabolic',
    topTitle: 'Inside your body',
    headline: 'Your body is always adapting',
    body:
      'Over many hours without food, insulin eases, stored energy is used more efficiently, and many people notice steadier energy and clearer focus — everyone’s timeline is a little different.',
    gradient: ['#F5EDFF', '#D4C4F5'],
  },
  {
    id: 'repair',
    topTitle: 'Longer fasts',
    headline: 'Space for renewal',
    body:
      'Extended fasting is linked in research with cellular cleanup and metabolic flexibility. Go at your own pace and stay in tune with how you feel.',
    gradient: ['#E8FFF5', '#A8E8CF'],
  },
  {
    id: 'discipline',
    topTitle: 'The long game',
    headline: 'Discipline compounds',
    body:
      'Missing a day doesn’t erase your path. Consistency beats perfection — each fast you complete is a vote for the calmer, stronger version of you.',
    gradient: ['#FFF0E8', '#F5C4A8'],
  },
  {
    id: 'disclaimer',
    topTitle: 'Aayu',
    headline: 'Wellness, not a prescription',
    body:
      'This app shares general education only. It is not medical advice. If you have a condition, take medication, are pregnant, or aren’t sure fasting is right for you, speak with a qualified clinician first.',
    gradient: ['#F0F4F8', '#C8D8E8'],
  },
];
