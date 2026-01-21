const imgLoader = ({src, width, quality} : { src: string, width: number, quality: number }) => {
    return src.indexOf(`wh:`) > -1 ? src : `${src}/wh:${width}/q:${quality || 75}`
}

export default imgLoader