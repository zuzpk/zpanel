import { FileContextItem } from "@/types"
import { Box, Button, Group, TRANSITION_CURVES, TRANSITIONS, useDelayed, Variant } from "@zuzjs/ui"
import { useEffect, useMemo } from "react"

const FileManagerContext : React.FC<{
    menu: FileContextItem[]
}> = ({ menu }) => {
    
    const _menu = useMemo(() => menu.filter(i => i.enabled), [menu])

    const when = menu.length > 0

    useEffect(() => {}, [_menu])


    return <Box
        aria-hidden={!when}
        as={`abs center-x bottom:40 zIndex:10 flex aic jcc`}
        fx={{
            transition: TRANSITIONS.SlideInBottom,
            curve: TRANSITION_CURVES.Liquid,
            duration: 0.5,
            when
        }}>
        <Group
        fx={{
            transition: TRANSITIONS.SlideInBottom,
            curve: TRANSITION_CURVES.Liquid,
            duration: 0.5,
            when
        }}
        fxStep={0.05}
        fxDelay={0.1}
        as={`flex aic gap:2 bg:$dim-light r:100 center-x p:3 zIndex:10`}>
        { _menu
            .map(item => (
            <Button 
                title={item.label}
                as={`w:40! h:40! bg:transparent! p:14! &hover(bg:$dim!)`}
                variant={Variant.Small}
                key={item.label} 
                icon={item.icon} 
                onClick={item.action} />
        ))}
    </Group>
    </Box>
}

export default FileManagerContext
