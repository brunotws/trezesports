const PSE_ALERT_THRESHOLD = 2

export function checkPseAlert(pse: number, plannedLoad: number): boolean {
  return pse >= plannedLoad + PSE_ALERT_THRESHOLD
}

export function getPseLabel(pse: number): string {
  if (pse === 0)  return 'Repouso'
  if (pse <= 2)   return 'Muito Leve'
  if (pse <= 4)   return 'Moderado'
  if (pse <= 6)   return 'Pesado'
  if (pse <= 8)   return 'Muito Pesado'
  return 'Máximo'
}
