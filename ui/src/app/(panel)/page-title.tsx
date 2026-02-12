"use client"
import { Box, Button, css, Group, Icon, Text, TRANSITION_CURVES, TRANSITIONS, Variant } from '@zuzjs/ui';
import React from 'react';
import { PageAction, PageTitle as PageTitleBase } from '../../types';
import Link from 'next/link';
import { useDelayed } from '@zuzjs/hooks';

const PageTitle : React.FC<{
    crumb: PageTitleBase[],
    actions?: PageAction[],
}> = ({ crumb, actions }) => {

    const when = useDelayed()

    return <Box
        as={`flex aic gap:50 mb:25`}>

        <Box as={`flex aic gap:15 opacity:0.5`}>
            { crumb.map((c, i) => <>
                { c.link ? <Link href={c.link} className={css(`tdn`)}>
                    <Box as={`flex aic gap:8`}>
                        <Icon name={c.icon} as={`s:20`} />
                        <Text as={`s:20 bold`}>{c.label}</Text>
                    </Box>
                </Link> :
                <Box as={`flex aic gap:8`}>
                    <Icon name={c.icon} as={`s:20`} />
                    <Text as={`s:20 bold`}>{c.label}</Text>
                </Box> }
            { crumb[i+1] ? <Icon name={`chevron-right`} as={`s:14`} /> : null }
            </>) }
        </Box>

        <Box as={`flex aic flex:1 jce`}>
            { actions?.map(a => <Button 
                onClick={a.fn}
                key={`page-action-${a.label}`}>{a.label}</Button>) }
        </Box>

    </Box>
}

export default PageTitle;