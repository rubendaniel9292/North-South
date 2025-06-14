//  Utilidades para persistir selección de pólizas

export const saveSelectedPolicies = (advisorId, selectedPolicies) => {
  localStorage.setItem(
    `selectedPolicies_${advisorId}`,
    JSON.stringify(selectedPolicies)
  );
};

export const loadSelectedPolicies = (advisorId) => {
  const data = localStorage.getItem(`selectedPolicies_${advisorId}`);
  return data ? JSON.parse(data) : null;
};
