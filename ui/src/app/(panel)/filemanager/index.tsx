"use client"
import { Box, Icon, Table, Text } from '@zuzjs/ui';
import React, { useCallback, useEffect } from 'react';
import { formatSize, time, withPost } from "@zuzjs/core"
import { useStore } from '@zuzjs/store';
import { AppStore, Store } from '../../../store';
import { FileItem, PubEvent } from '../../../types';
import path from "path"
import { pubsub } from '../../../cache';

const FileManager : React.FC<{
    onDirChange?: (dir: string) => void,
    onSelect?: (dir: string) => void,
    defaultDir?: string,
}> = ({
    onDirChange,
    onSelect,
    defaultDir
}) => {
    
    const { 
        loading, 
        error, 
        currentDir,
        selectedItem,
        items, dispatch } = useStore<typeof AppStore.FileManager>(Store.FileManager);

    const loadFF = useCallback(async (d: string) => {

        onDirChange?.(d)
        dispatch({ loading: true, error: null })
        
        withPost<{
            items: FileItem[]
        }>(
            `/_/fm/ls`,
            { d }
        )
        .then(rsp => {
            dispatch({ loading: false, error: null, items: rsp.items, currentDir: d })
        })
        .catch(err => {
            dispatch({ loading: false, error: null, items: [], currentDir: d })
        })

    }, [])

    useEffect(() => {
        loadFF(defaultDir ?? currentDir)
        pubsub.on(PubEvent.OpenDirectory, (d) => loadFF(d))
    }, [])

    return <Box as={`--fm flex cols`}>
       <Table 
            loading={loading}
            loadingRowCount={10}
            loadingMessage={`please wait`}
            // animateRows={true}
            onRowClick={(e, r) => {
                onSelect?.(r.path)
                dispatch({ selectedDir: r })
            }}
            emptyMessage={<Box as={`flex aic jcc cols p:100 gap:20`}>
                <Icon name={`folder`} as={`s:36`} />
                <Text as={`s:18`}>This folder is empty</Text>
            </Box>}
            schema={[
                {
                    id: `name`,
                    value: <Text as={`s:12`}>Name</Text>,
                    render: ro => <Box 
                        onDoubleClick={e => {
                            if ( ro.isDir ){
                                loadFF( ro.path )
                            }
                        }}      
                        as={`flex aic gap:8 nous`}>
                        <Box as={`minW:30 w:30 h:30 flex aic jcc r:80 ${selectedItem?.token == ro.token ? `bg:$green-500` : ``}`}>
                            <Icon name={selectedItem?.token == ro.token ? `check` : ro.isDir ? `folder` : `document-1`} as={`${ro.isDir ? `` : `opacity:0.5`} s:16`} />
                        </Box>
                        <Text as={`s:16 text-wrap`}>{ro.label}</Text>
                    </Box>
                },
                {
                    id: `size`,
                    maxW: 140,
                    value: <Text as={`s:12`}>Size</Text>,
                    render: ro => <Box as={`flex aic gap:8`}>
                        <Text as={`s:13`}>{ro.isDir ? `-` : formatSize(ro.size)}</Text>
                    </Box>
                },
                {
                    id: `modified`,
                    maxW: 170,
                    value: <Text as={`s:12`}>Modified</Text>,
                    render: ro => <Box as={`flex aic gap:8`}>
                        <Text as={`s:13`}>{time(ro.modified, `lll`)}</Text>
                    </Box>
                },
            ]}
            rows={items}
        />
    </Box>

}

export default FileManager;