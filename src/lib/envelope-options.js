// Use the existing allowed_materials field for envelope equipment/instructions.
export const ENVELOPE_OPTIONS = [
    ['optBooks', 'นำตำราเข้าห้องสอบได้'],
    ['optCalculator', 'นำเครื่องคิดเลขเข้าห้องสอบได้'],
    ['optNoRuler', 'ห้ามนำไม้บรรทัดมีสูตรคณิตศาสตร์เข้าสอบ'],
];

const LEGACY_MATERIALS = {
    optBooks: ['ตำรา', 'หนังสือ'],
    optCalculator: ['เครื่องคิดเลข', 'เครื่องคิดเลขวิทยาศาสตร์'],
};

export function envelopeOptionsFromMaterials(materials) {
    const saved = new Set(Array.isArray(materials) ? materials : []);
    return Object.fromEntries(ENVELOPE_OPTIONS.map(([key, label]) => [
        key, [label, ...(LEGACY_MATERIALS[key] ?? [])].some((value) => saved.has(value)),
    ]));
}

export function envelopeOptionsToMaterials(options, existingMaterials) {
    const optionValues = new Set(ENVELOPE_OPTIONS.flatMap(([key, label]) => [label, ...(LEGACY_MATERIALS[key] ?? [])]));
    const otherMaterials = (Array.isArray(existingMaterials) ? existingMaterials : []).filter((value) => !optionValues.has(value));
    return [...new Set([
        ...otherMaterials,
        ...ENVELOPE_OPTIONS.filter(([key]) => options[key]).map(([, label]) => label),
    ])];
}
