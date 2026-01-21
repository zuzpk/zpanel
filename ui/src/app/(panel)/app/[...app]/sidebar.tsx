"use client"
import { Box, css, Text, Icon, Group, TRANSITIONS, TRANSITION_CURVES, useDelayed, Image } from '@zuzjs/ui';
import React, { useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { APP_NAME, APP_VERSION } from "@/config"

const Sidebar : React.FC = (_props) => {

    const { app } = useParams()
    const [ id, section ] = app
    const pathName = usePathname()
    const when = useDelayed()

    const appNav = useMemo(() => [
        {
            icon: `colorfilter`,
            label: `Dashboard`,
            href: `/app/${id}/dashboard`
        },
        {
            icon: `book`,
            label: `Logs`,
            href: `/app/${id}/logs`
        },
        {
            icon: `hashtag`,
            label: `Source Code`,
            href: `/app/${id}/source`
        },
    ], [id])

    return <Group
        fx={{
            transition: TRANSITIONS.SlideInLeft,
            curve: TRANSITION_CURVES.Liquid,
            when,
            duration: 1,
            delay: 0.05
        }}
        fxDelay={0.2}
        fxStep={0.1}
        as={`maxW:270 flex:1 h:calc[100vh - 60px] p:25 flex cols gap:8`}>

            <Box as={`logo flex aic p:10 mb:25`}>
                <Text as={`s:20 bold`}>App</Text>
            </Box> 

       {appNav.map((n, i) => <Link 
            href={n.href} 
            className={css([
                `flex aic ass r:20 gap:10 tdn p:6,10 opacity:0.5 &hover(bg:$dim-light opacity:1)`,
                `${pathName == n.href ? `bg:$dim-hover opacity:0.9` : ``}`
            ])}>
            <Icon name={n.icon} as={`s:20`} />
            <Text as={`s:18`}>{n.label}</Text>
       </Link>)}

    </Group>
}

export default Sidebar;