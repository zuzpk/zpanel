"use client"
import { dynamic } from '@zuzjs/core';
import { Box, Button, Form, Input, Text, useToast, Variant } from '@zuzjs/ui';
import React from 'react';

const CreateFolder : React.FC<{
    onSuccess: (resp: dynamic) => void,
    parent: string
}> = ({ onSuccess, parent }) => {

    const toast = useToast()

    return <Form
        onSuccess={onSuccess}
        onError={err => {
            toast.error(err.message || `Folder not created...`)
        }}
        action={`/_/fm/new_folder`}
        as={`flex cols gap:5 w:400 p:20`}>
       
        <Box as={`flex aic gap:5 mb:20`}>
            <Text as={`s:14 bold opacity:0.5`}>Parent</Text>
            <Text as={`s:14 opacity:0.7 text-wrap`}>{parent}</Text>
        </Box>

        <Text as={`s:14 bold`}>Name</Text>
        <Input 
            autoFocus={true}
            placeholder={`Folder Name`} name={`n`} variant={Variant.Small} required />
        
        <Input type={`hidden`} value={parent} name={`d`} />

        <Button
            type={`submit`} 
            variant={Variant.Small} 
            as={`mt:30 w:160! bold`}>Save</Button>

    </Form>

}

export default CreateFolder;