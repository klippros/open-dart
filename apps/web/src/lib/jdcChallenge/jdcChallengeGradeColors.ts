import { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'

export const JDC_CHALLENGE_GRADE_COLORS: Record<JdcChallengeGrade, string> = {
  [JdcChallengeGrade.White]: '#f5f5f5',
  [JdcChallengeGrade.Purple]: '#9b59b6',
  [JdcChallengeGrade.Yellow]: '#f1c40f',
  [JdcChallengeGrade.Green]: '#27ae60',
  [JdcChallengeGrade.Blue]: '#3498db',
  [JdcChallengeGrade.Red]: '#e74c3c',
  [JdcChallengeGrade.Black]: '#1a1a1a',
  [JdcChallengeGrade.Gold]: '#d4af37',
}

export const JDC_CHALLENGE_GRADE_TEXT_COLORS: Record<JdcChallengeGrade, string> = {
  [JdcChallengeGrade.White]: '#111111',
  [JdcChallengeGrade.Purple]: '#ffffff',
  [JdcChallengeGrade.Yellow]: '#111111',
  [JdcChallengeGrade.Green]: '#ffffff',
  [JdcChallengeGrade.Blue]: '#ffffff',
  [JdcChallengeGrade.Red]: '#ffffff',
  [JdcChallengeGrade.Black]: '#ffffff',
  [JdcChallengeGrade.Gold]: '#111111',
}

export const jdcChallengeGradeColor = (grade: JdcChallengeGrade): string =>
  JDC_CHALLENGE_GRADE_COLORS[grade]

export const jdcChallengeGradeTextColor = (grade: JdcChallengeGrade): string =>
  JDC_CHALLENGE_GRADE_TEXT_COLORS[grade]
