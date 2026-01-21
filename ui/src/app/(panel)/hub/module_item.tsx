"use client"
import { Box, Icon, Text, TRANSITION_CURVES, TRANSITIONS, useDelayed, css } from '@zuzjs/ui';
import React from 'react';
import { Module } from './modules';
import Link from "next/link"

const Item : React.FC<{ meta?: Module, index: number }> = ({ meta, index }) => {

    const { icon, name, link } = meta || {}
    const when = useDelayed()

    return <Box 
        fx={{
            transition: TRANSITIONS.SlideInBottom,
            curve: TRANSITION_CURVES.Spring,
            when,
            delay: index * 0.1,
            duration: 0.5,
        }}
        as={[
            `w:100% h:100% p:10 r:90 flex cols aic jcc gap:15 cursor:pointer &hover(bg:$dim)`,
            `${meta ? `` : `bg:$dim`}`
        ]}>
        <Box
            skeleton={{
                enabled: meta ? false : true,
                width: `100%`
            }} 
            as={[
                `w:100% ratio:1/1 r:$radius-md bg:$gray-500 r:100 flex aic jcc`,
                `bg:gradient-to-45-cd6a19-7204ff`
            ]}>
            { icon && <Icon name={icon} as={`s:50 c:fff`} /> }
        </Box>
       <Text as={`s:18 wordwrap`}
        skeleton={{
            enabled: meta ? false : true,
            width: `70%`,
        }} >{name || `--`}</Text>
    </Box>

}

const ModuleItem : React.FC<{
    meta?:  Module,
    index: number
}> = ({
    meta,
    index,
}) => {

    return meta ?
        <Link href={meta.link} className={css(`tdn`)}>
            <Item index={index} meta={meta} />
        </Link> 
        : <Item index={index} />;
}

export default ModuleItem;