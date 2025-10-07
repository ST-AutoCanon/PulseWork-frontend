export function isBirthdayToday(dob) {
  const today = new Date();
  const birth = new Date(dob);
  return (
    today.getDate() === birth.getDate() &&
    today.getMonth() === birth.getMonth()
  );
}
