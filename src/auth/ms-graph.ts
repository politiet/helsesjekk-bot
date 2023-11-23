import { headers } from 'next/headers'
import { grantAzureOboToken, isInvalidTokenSet } from '@navikt/next-auth-wonderwall'

import { isLocal } from '../utils/env'

import { fakeMembersOfResponse } from './fake-members-of-response'
import { getToken } from './authentication'

export async function getMembersOf(): Promise<
    MsGraphGroupsResponse | { error: string; status?: number; statusText?: string }
> {
    if (isLocal) {
        return fakeMembersOfResponse
    }

    const token = await getToken();

    console.log("Trying to reach https://graph.microsoft.com/v1.0/me/memberOf");
    const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        return {
            error: 'Feil fra Microsoft, prøv igjen senere.',
            status: response.status,
            statusText: response.statusText,
        }
    }

    return response.json()
}

export type MsGraphGroup = {
    id: string
    createdDateTime: string
    description?: string
    displayName: string | null
    groupTypes: string[]
    mail?: string
    mailEnabled: boolean
    mailNickname: string
    onPremisesDomainName?: string
    onPremisesLastSyncDateTime?: string
    onPremisesNetBiosName?: string
    onPremisesSamAccountName?: string
    onPremisesSecurityIdentifier?: string
    onPremisesSyncEnabled?: boolean
    proxyAddresses: string[]
    renewedDateTime: string
    securityEnabled: boolean
    securityIdentifier: string
    visibility?: string
}

type MsGraphGroupsResponse = {
    '@odata.context': string
    '@odata.nextLink'?: string
    value: MsGraphGroup[]
}
