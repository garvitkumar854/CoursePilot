export const subjects = [
    {
        id: "artificial-intelligence",
        order: 1,
        slug: "artificial-intelligence",
        name: "Artificial Intelligence",
        assignmentCount: 0,
        lastUpdatedLabel: "17 days ago",
        accentColor: "#ec4899",
        tint: "rgba(236, 72, 153, 0.12)",
        summary: "Conceptual foundations for intelligent systems, reasoning, and automation.",
        dateGroups: [],
    },
    {
        id: "data-mining",
        order: 2,
        slug: "data-mining",
        name: "Data Mining",
        assignmentCount: 8,
        lastUpdatedLabel: "12 days ago",
        accentColor: "#10b981",
        tint: "rgba(16, 185, 129, 0.12)",
        summary: "Pattern discovery, preprocessing, and knowledge extraction from data.",
        dateGroups: [
            {
                label: "30 July 2026",
                assignments: [
                    {
                        title: "What is Data Mining?",
                        description: "A concise overview of the discipline and its goals.",
                    },
                    {
                        title: "What are the factors involved while choosing Data Mining?",
                        description: "Selection criteria, data quality, scale, and business fit.",
                    },
                    {
                        title: "Explain the Applications of Data Mining.",
                        description: "Retail, healthcare, finance, security, and recommendations.",
                    },
                    {
                        title: "What is Data Transformation?",
                        description: "Preprocessing step that reshapes raw data for analysis.",
                    },
                    {
                        title: "Define Data Integration.",
                        description: "Combining data from multiple sources into one coherent view.",
                    },
                    {
                        title: "Explain the benefits of using Data Mining in different fields.",
                        description: "How analytics improves decisions in industry and research.",
                    },
                    {
                        title: "Explain all Data Mining issues and challenges with their solutions.",
                        description: "Data quality, privacy, scalability, and interpretability.",
                    },
                    {
                        title: "Explain the Data Mining process in detail with examples.",
                        description: "An end-to-end workflow from collection to deployment.",
                    },
                ],
            },
        ],
    },
    {
        id: "programming-in-python",
        order: 3,
        slug: "programming-in-python",
        name: "Programming In Python",
        assignmentCount: 0,
        lastUpdatedLabel: "17 days ago",
        accentColor: "#f59e0b",
        tint: "rgba(245, 158, 11, 0.12)",
        summary: "Syntax, program structure, and practical problem solving with Python.",
        dateGroups: [],
    },
    {
        id: "image-processing",
        order: 4,
        slug: "image-processing",
        name: "Image Processing",
        assignmentCount: 5,
        lastUpdatedLabel: "17 days ago",
        accentColor: "#8b5cf6",
        tint: "rgba(139, 92, 246, 0.12)",
        summary: "Spatial filtering, image enhancement, and computer vision basics.",
        dateGroups: [
            {
                label: "25 July 2026",
                assignments: [
                    { title: "Sampling and Quantization", description: "Representation of continuous images in digital form." },
                    { title: "Intensity Transformations", description: "Point operations for contrast and brightness control." },
                    { title: "Histogram Processing", description: "Redistributing pixel values for better visibility." },
                    { title: "Spatial Filtering", description: "Smoothing and sharpening with local neighborhoods." },
                    { title: "Edge Detection", description: "Finding boundaries and structural transitions in images." },
                ],
            },
        ],
    },
];

export function getSubjectBySlug(slug) {
    return subjects.find((subject) => subject.slug === slug);
}

export function getSubjectRankLabel(order) {
    return `#${String(order).padStart(2, "0")}`;
}