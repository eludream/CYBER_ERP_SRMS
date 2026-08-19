import dynamicIconImports from "lucide-react/dynamicIconImports";

// Keep the picker synchronized with the complete icon catalog supplied by the
// installed lucide-react version instead of maintaining a limited manual list.
export const iconNames = Object.keys(dynamicIconImports).sort();
