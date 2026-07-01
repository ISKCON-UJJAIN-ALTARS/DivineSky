// Generate altar sizes from 1 ft to 15 ft in 0.5 ft increments
const generateAltarSizes = () => {
  const sizes = [];
  for (let i = 1; i <= 15; i += 0.5) {
    sizes.push({
      value: `${i}ft`,
      label: `${i} ft`,
      numericValue: i
    });
  }
  return sizes;
};

export const ALTAR_SPECIFICATIONS = {
  size: {
    label: "Altar Size",
    required: true,
    options: generateAltarSizes()
  },
  design: {
    label: "Altar Design",
    required: true,
    options: [
      { value: "3-domed", label: "3 Domed Design" },
      { value: "opulent-3-domed", label: "3 Domed Design" },
      { value: "4-dome", label: "4 Dome Design" },
      { value: "iskcon-logo", label: "ISKCON Logo Design" },
      { value: "hexagonal", label: "Hexagonal Altar Design" },
      { value: "peacock", label: "Peacock Design" },
      { value: "tovp", label: "TOVP" },
      { value: "chittagong", label: "Chittagong" },
      { value: "vrindavan", label: "Vrindavan" }
    ]
  }
};

// Helper function to get specification options
export const getSpecificationOptions = (specKey) => {
  return ALTAR_SPECIFICATIONS[specKey]?.options || [];
};

// Helper function to check if specification is required
export const isSpecificationRequired = (specKey) => {
  return ALTAR_SPECIFICATIONS[specKey]?.required || false;
};
