"use client"
import { useStore } from '@zuzjs/store';
import { Box, Button, Crumb, ScrollView, Text } from '@zuzjs/ui';
import React, { useRef } from 'react';
import { AppStore, Store } from '../../../store';
import { pubsub } from '../../../cache';
import { PubEvent } from '../../../types';
import FileManager from '.';

const FileBrowser : React.FC<{
    onChoose: (dir: string) => void,
    defaultDir?: string,
}> = ({ onChoose, defaultDir }) => {

    const {
        loading,
        currentDir 
    } = useStore<typeof AppStore.FileManager>(Store.FileManager);
    const choosenDir = useRef(defaultDir || currentDir)

    return <ScrollView as={`flex:1 flex cols minW:800`}>

        <Box as={`p:25,0,10,20 flex borderBottom:1,$border,solid sticky top:0`}>

            <Box as={`flex cols flex:1`}>

                <Text as={`s:18 bold mb:6 pl:6`}>Choose Home Directory</Text>
                <Text as={`s:14 opacity:0.5 p:0,6`}>Path: {currentDir}</Text>
                { currentDir !== `/` && <Crumb
                    items={[
                        {
                            label: `Root`,
                            action: () => pubsub.emit(PubEvent.OpenDirectory, `/`)
                        },
                        ...currentDir.split(`/`)
                        .filter(n => Boolean(n))
                        .map((c, i) => ({
                            label: c,
                            action: () => {
                                pubsub.emit(PubEvent.OpenDirectory,  [ ...currentDir.split(`/`).slice(0, i+1), c ].join(`/`))
                            }
                            }))]} /> }
            </Box>

            <Box as={`flex aic jcc gap:10`}>
                <Button onClick={() => {
                    onChoose(choosenDir.current)
                    pubsub.emit(PubEvent.OnTargetDirChoosen)
                }}>Done</Button>
                <Button onClick={() => pubsub.emit(PubEvent.OnTargetDirChoosen)}>Cancel</Button>
            </Box>

        </Box>
        <FileManager 
            defaultDir={defaultDir}
            onSelect={d => choosenDir.current = d}
            onDirChange={d => choosenDir.current = d} />

    </ScrollView>
}

export default FileBrowser;