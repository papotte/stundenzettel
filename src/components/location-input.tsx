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
      !isSpecialEntry && !disabled && suggestions.length > 0 && focused

    return (
      <div className="relative flex flex-col items-start w-full">
        <div className="relative w-full flex items-center">
          <Input
            {...field}
            ref={ref}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              onChange(e.target.value)
              setActiveSuggestion(-1)
            }}
            disabled={disabled}
            placeholder={placeholder}
            className="pr-10"
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
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="location-suggestion-list"
            aria-activedescendant={
              activeSuggestion >= 0
                ? `location-suggestion-${activeSuggestion}`
                : undefined
            }
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
                  className="absolute right-0 mr-1 h-8 w-8"
                >
                  {isFetchingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get current location</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {/* Custom dropdown for suggestions */}
        {showDropdown && (
          <div
            id="location-suggestion-list"
            role="listbox"
            className="absolute left-0 top-full mt-1 w-full bg-popover border border-border rounded shadow-lg z-20"
            style={{ minWidth: '100%' }}
          >
            {suggestions.map((suggestion, i) => (
              <button
                key={suggestion}
                type="button"
                id={`location-suggestion-${i}`}
                role="option"
                aria-selected={activeSuggestion === i}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent focus:bg-accent border-0 bg-transparent ${
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
