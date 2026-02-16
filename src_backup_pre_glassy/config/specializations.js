// Worker specialization configuration
// Add new specializations here to make them available throughout the app

export const WORKER_SPECIALIZATIONS = [
    {
        id: 'graphic_design',
        label: 'Graphic Designer',
        icon: 'Palette',
        description: 'Brand identity, logos, marketing materials',
        color: '#ec4899' // Pink
    },
    {
        id: 'web_design',
        label: 'Web Designer',
        icon: 'Code',
        description: 'Websites, web apps, responsive design',
        color: '#3b82f6' // Blue
    },
    {
        id: 'printing',
        label: 'Printing Specialist',
        icon: 'Printer',
        description: 'Print materials, packaging, production',
        color: '#8b5cf6' // Purple
    }
]

export const getSpecializationById = (id) => {
    return WORKER_SPECIALIZATIONS.find(spec => spec.id === id)
}

export const getSpecializationLabel = (id) => {
    const spec = getSpecializationById(id)
    return spec ? spec.label : 'Worker'
}
