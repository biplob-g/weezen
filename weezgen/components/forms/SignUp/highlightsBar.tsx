'use client'

import { useAuthContextHook } from '@/context/useAuthContext'
import { cn } from '@/lib/utils'
import React from 'react'

const HighlightBar = () => {

    const { currentStep } = useAuthContextHook()

  return (
    <div className='grid grid-cols-3 gap-3'>
    <div
    className={cn(
        'rounded-full h-2 col-span-1',
        currentStep == 1 ? 'bg-primary' : 'bg-gray-200'
    )}
    >
        
    </div>
    <div
    className={cn(
        'rounded-full h-2 col-span-1',
        currentStep == 2 ? 'bg-primary' : 'bg-gray-200'
    )}
    >
        
    </div>
    <div
    className={cn(
        'rounded-full h-2 col-span-1',
        currentStep == 3 ? 'bg-primary' : 'bg-gray-200'
    )}
    >
        
    </div>
        </div>
  )
}

export default HighlightBar