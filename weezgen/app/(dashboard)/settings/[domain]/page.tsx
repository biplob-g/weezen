import { onGetCurrentDomainInfo } from '@/actions/settings'
import SettingsForm from '@/components/forms/SignUp/settings/form'
import InfoBars from '@/components/infoBar'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {params: {domain: string}}

const DomainSettingsPage = async ({params}: Props) => {
    const domain = await onGetCurrentDomainInfo(params.domain)
  if(!domain) redirect('/dashoard')
    return (
    <>
    <InfoBars/>
<div className='overflow-y-auto w-full chat-window flex-1 h-0'>
<SettingsForm
plan={Domain.subscription?.plan!}
chatBot={domain.domains[0].id}
id={domain.domains[0].id}
name={domain.domains[0].name}
/>
</div>
    </>
  )
}

export default DomainSettingsPage