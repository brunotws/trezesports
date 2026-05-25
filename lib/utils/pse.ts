const PSE_ALERT_THRESHOLD = 2

export function checkPseAlert(pse: number, plannedLoad: number): boolean {
  return pse >= plannedLoad + PSE_ALERT_THRESHOLD
}

export function getPseLabel(pse: number): string {
  if (pse <= 3) return 'Leve'
  if (pse <= 5) return 'Moderado'
  if (pse <= 7) return 'Difícil'
  if (pse <= 9) return 'Muito difícil'
  return 'Máximo'
}
