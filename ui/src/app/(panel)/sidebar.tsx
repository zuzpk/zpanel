"use client"
import { APP_NAME, APP_VERSION } from "@/config";
import { AppStore, Store } from '@/store';
import { useStore } from '@zuzjs/store';
import { Box, ColorScheme, css, Icon, Image, Position, Text, ToolTip } from '@zuzjs/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import Modules, { Module } from './hub/modules';

const Sidebar : React.FC = (_props) => {

    const { loading: youLoading, ID, nm, ir } = useStore<typeof AppStore.User>(Store.User)
    const [ , pathName ] = usePathname().split(`/`)

    return <Box as={`w:60 h:100vh flex cols bg:$dim-light`}>
       <Box as={`flex:1 flex cols gap:5`}>
            <Box as={`logo flex aic p:15 mb:25`}>
                <Link href={`/` as any} className={css(`tdn`)}>
                    <ToolTip title={APP_NAME} position={Position.Right}>
                        <Image src="/imgs/zuz-logo.png" alt={APP_NAME} as={`w:25`} />
                    </ToolTip>
                </Link>
            </Box>
            {[
                {
                    icon: `colorfilter`,
                    name: `Hub`,
                    link: `/hub`,
                },
                ...Modules
            ].map((item: Module, index: number) => <ToolTip title={item.name} position={Position.Right} margin={6}>
                <Link 
                    href={item.link} 
                    key={`sidebar-${index}-${item.name}-${item.link}`}
                    className={css([
                        `flex aic jcc w:100% h:40 opacity:0.5 tdn &hover(bg:$dim-hover opacity:1)`,
                        `${`/${pathName}` == item.link ? `bg:$dim-hover opacity:0.9` : ``}`
                    ])}>
                    <Icon name={item.icon} as={`s:20`} />
                </Link>
            </ToolTip>)}
       </Box>
       <Box as={`flex:1 flex cols aic jce p:10 gap:15`}>
            <ColorScheme />
            <Text as={`s:9 bold opacity:0.5 tac`}>v{APP_VERSION}</Text>
       </Box>
    </Box>
}

export default Sidebar;