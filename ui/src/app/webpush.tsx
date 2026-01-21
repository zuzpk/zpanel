/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { VAPID_PUBLIC_KEY } from '@/config';
import { withPost } from '@zuzjs/core';
import { usePushNotifications } from '@zuzjs/ui';
import React, { useEffect } from 'react';

const PushNotifications : React.FC = (_props) => {

    const {
        permission,
        subscribe,
    } = usePushNotifications({
        vapidPublicKey: VAPID_PUBLIC_KEY,
        requestPermissionOnMount: true,
    })

    useEffect(() => {
        if ( `granted` == permission ){
            subscribe()
            .then(meta => {
                
                withPost<{
                    kind: string
                }>(
                    `/_/a/push_oauth`,
                    { token: meta }
                )
                .then(() => {})
                .catch(() => {})

            })
        }
    }, [permission, subscribe])

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'PUSH_NOTIFICATION') {
                const audio = new Audio(e.data.soundUrl);
                audio.play().catch(() => {
            });
        }
        };

        navigator.serviceWorker?.addEventListener('message', handler);
        return () => navigator.serviceWorker?.removeEventListener('message', handler);
    }, []);

    return null

}

export default PushNotifications;