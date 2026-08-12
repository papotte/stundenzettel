import React, { forwardRef, useState } from 'react'

import { Loader2, MapPin } from 'lucide-react'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface LocationInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  suggestions: string[]
  isSpecialEntry: boolean
  placeholder: string
  onGetCurrentLocation?: () => void
  isFetchingLocation?: boolean
  onBlur?: () => void
  onFocus?: () => void
  displayValue?: string
}

export const LocationInput = forwardRef<HTMLInputElement, LocationInputProps>(
  (
    {
      value,
      onChange,
      disabled,
      suggestions,
      isSpecialEntry,
      placeholder,
      onGetCurrentLocation,
      isFetchingLocation,
      onBlur,
      onFocus,
      displayValue,
      ...field
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = useState(value)
    const [focused, setFocused] = useState(false)
    const [activeSuggestion, setActiveSuggestion] = useState(-1)

    React.useEffect(() => {
      setInputValue(value)
    }, [value])

    const showDropdown =
      focused && suggestions.length > 0 && !disabled && !isSpecialEntry

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type="text"
          value={displayValue ?? inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            onChange(e.target.value)
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="location-suggestion-list"
          aria-activedescendant={
            activeSuggestion >= 0
              ? `location-suggestion-${activeSuggestion}`
              : undefined
          }
          onFocus={() => {
            setFocused(true)
            onFocus?.()
          }}
          onBlur={() => {
            setTimeout(() => setFocused(false), 100)
            onBlur?.()
          }}
          onKeyDown={(e) => {
            if (!suggestions.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveSuggestion(
                (activeSuggestion) =>
                  (activeSuggestion + 1) % suggestions.length,
              )
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveSuggestion(
                (activeSuggestion) =>
                  (activeSuggestion - 1 + suggestions.length) %
                  suggestions.length,
              )
            } else if (e.key === 'Enter' || e.key === 'Tab') {
              if (
                activeSuggestion >= 0 &&
                activeSuggestion < suggestions.length
              ) {
                e.preventDefault()
                setInputValue(suggestions[activeSuggestion])
                onChange(suggestions[activeSuggestion])
                setActiveSuggestion(-1)
                setFocused(false)
              }
            } else if (e.key === 'Escape') {
              setFocused(false)
              setActiveSuggestion(-1)
            }
          }}
          {...field}
        />
        {!isSpecialEntry && onGetCurrentLocation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={onGetCurrentLocation}
                aria-label="Get current location"
                disabled={isFetchingLocation}
                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              >
                {isFetchingLocation ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MapPin className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get current location</p>
            </TooltipContent>
          </Tooltip>
        )}
        {showDropdown && (
          <div
            id="location-suggestion-list"
            role="listbox"
            className="absolute top-full left-0 z-20 mt-1 w-full rounded border border-border bg-popover shadow-lg"
            style={{ minWidth: '100%' }}
          >
            {suggestions.map((suggestion, i) => (
              <button
                key={suggestion}
                type="button"
                id={`location-suggestion-${i}`}
                role="option"
                aria-selected={activeSuggestion === i}
                className={`w-full border-0 bg-transparent px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent ${
                  activeSuggestion === i ? 'bg-accent text-primary' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setInputValue(suggestion)
                  onChange(suggestion)
                  setActiveSuggestion(-1)
                  setFocused(false)
                }}
                onMouseEnter={() => setActiveSuggestion(i)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  },
)
LocationInput.displayName = 'LocationInput'
