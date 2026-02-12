export interface Module {
    icon: string;
    name: string;
    link: string;
}

const Modules : Module[] = [
    {
        icon: `box`,
        name: `Apps`,
        link: `/apps`,
    },
    {
        icon: `document-1`,
        name: `File Manager`,
        link: `/fm`,
    },
    {
        icon: `driver`,
        name: `Nginx`,
        link: `/nginx`,
    },
    {
        icon: `record-circle`,
        name: `Ports`,
        link: `/ports`,
    },
    {
        icon: `code-1`,
        name: `Terminal`,
        link: `/terminal`,
    },
    {
        icon: `notification`,
        name: `Alerts`,
        link: `/alerts`,
    },
]

export default Modules