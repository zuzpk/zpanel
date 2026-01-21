"use client"
import { Box, Button, Text, TRANSITION_CURVES, TRANSITIONS, useDelayed, Variant, css, Cover } from '@zuzjs/ui';
import React, { useCallback } from 'react';
import { ZuzApp, ZuzAppStatus } from '../../../types';
import Link from 'next/link';

const AppItem : React.FC<{
    index: number,
    meta?: ZuzApp,
    fun: ( id: string, action: `start` | `stop` | `restart` ) => void,
}> = ({ index, meta, fun }) => {

    const when = useDelayed()
    const { 
        id, 
        service, 
        pkg,
        path,
        url,
        status
    } = meta || {}

    const act = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>, action: `start` | `stop` | `restart`) => {
        e.preventDefault();
        e.stopPropagation();
        fun(id ?? `0`, action)
    }, [meta])

    return <Link href={`/app/${id}/dashboard`} className={css(`tdn`)}><Box 
        fx={{
            transition: TRANSITIONS.SlideInBottom,
            curve: TRANSITION_CURVES.Spring,
            when,
            delay: index * 0.1,
            duration: 0.5,
        }}
        as={[
            `w:100% ratio:1 p:10 r:$app-item-radius flex cols gap:15 cursor:pointer anim:0.2s rel --app-item`,
            `${meta ? `bg:$dim` : `bg:$dim-hover`}`,
            `&hover(shadow:0,0,0,5,$dim-hover)`
        ]}>
        <Cover when={status == ZuzAppStatus.Loading} />   
        <Box as={`w:100% h:100% r:80 bg:$dim-hover p:30 flex cols`}>
            
            <Box as={`bg:rgba[0,0,0,0.25] r:20 ass mb:15 p:2,8 flex aic gap:5`}>
                <Box as={`w:10 h:10 r:50 ${status == ZuzAppStatus.Stopped ? `bg:$red-500` : `bg:$green-500`}`} /> 
                <Text as={`s:14 bold`}>{status}</Text>
            </Box>
            <Box as={`w:50 h:50 r:90 bg:rgba[0,0,0,0.4] flex aic jcc s:24 bold mb:20`}>{(pkg?.name || `App`).charAt(0).toUpperCase()}</Box>
            <Text as={`s:18 bold mb:5`}>{pkg?.name}</Text>
            <Text as={`s:14 opacity:0.75`}>{service}</Text>
            <Text as={`s:14 opacity:0.5 mt:5`}>{url}</Text>
            <Text as={`s:14 opacity:0.5`}>{path}</Text>
            
        </Box>
        <Box as={`flex aic gap:10 p:3,30,8,30`}>
            {status == ZuzAppStatus.Stopped ? (
                <Button variant={Variant.Small} as={`--btn p:8! flex:1 r:90!`} onClick={(e) =>  act(e, `start`)}  icon={`play`}>Start</Button>
            ) : (
                <>
                    <Button variant={Variant.Small} as={`--btn p:8! flex:1 r:90!`} onClick={(e) =>  act(e, `stop`)} icon={`stop`}>Stop</Button>
                    <Button variant={Variant.Small} as={`--btn p:8! flex:1 r:90!`} onClick={(e) =>  act(e, `restart`)} icon={`refresh`}>Restart</Button>
                </>
            )}
        </Box>
    </Box></Link>
}

export default AppItem;