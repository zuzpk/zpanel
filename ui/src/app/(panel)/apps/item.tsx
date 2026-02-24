"use client"
import { useDelayed } from '@zuzjs/hooks';
import { Box, Button, Cover, css, Text, TRANSITION_CURVES, TRANSITIONS, Variant } from '@zuzjs/ui';
import Link from 'next/link';
import React, { useCallback } from 'react';
import { ZuzApp, ZuzAppStatus } from '../../../types';

const AppItem : React.FC<{
    index: number,
    meta?: ZuzApp,
    fun: ( id: string, action: `start` | `stop` | `restart` ) => void,
}> = ({ index, meta, fun }) => {

    const when = useDelayed()
    const { 
        id, 
        name,
        worker, 
        pkg,
        domain,
        description,
        git,
        port,
        path,
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
            
            {/* <Box as={`bg:rgba[0,0,0,0.25] r:20 ass mb:15 p:2,8 flex aic gap:5`}>
                <Box as={`w:10 h:10 r:50 ${status == ZuzAppStatus.Stopped ? `bg:$red-500` : `bg:$green-500`}`} /> 
                <Text as={`s:14 bold`}>{status}</Text>
            </Box> */}
            <Box as={[
                `w:50 h:50 r:90 flex aic jcc s:24 bold mb:20 rel`,
                `bg:${status == ZuzAppStatus.Stopped || status == ZuzAppStatus.Unknown
                        ? `$manatee-500` : `$green-500`}`
            ]}>
                {/* <Badge 
                    label={status}
                    size={12}
                    as={`abs bottom:-5 center-h`} /> */}
                {(name || pkg?.name || `App`).charAt(0).toUpperCase()}
            </Box>
            <Text as={`s:18 bold mb:5 text-wrap`}>{name || pkg?.name || `App`}</Text>
            <Text as={`s:14 opacity:0.75 text-wrap`}>{worker}</Text>
            <Text as={`s:14 opacity:0.5 mt:5 text-wrap`}>{git?.url}</Text>
            <Text as={`s:14 opacity:0.5 text-wrap`}>{path}</Text>
            
        </Box>
        <Box as={`flex aic gap:5 abs bottom:-20 center-h bg:$surface p:md r:md`}>
            {status == ZuzAppStatus.Stopped ? (
                <Button variant={Variant.Small} as={`--btn p:8! flex:1 r:90!`} onClick={(e) =>  act(e, `start`)}  icon={`play`} />
            ) : (
                <>
                    <Button variant={Variant.Small} as={`--btn p:8! flex:1 r:90!`} onClick={(e) =>  act(e, `stop`)} icon={`stop`} />
                    <Button variant={Variant.Small} as={`--btn p:8! flex:1 r:90!`} onClick={(e) =>  act(e, `restart`)} icon={`refresh`} />
                </>
            )}
        </Box>
    </Box></Link>
}

export default AppItem;