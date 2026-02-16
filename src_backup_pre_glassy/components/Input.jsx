import React from 'react'

const Input = ({ label, type = 'text', placeholder, value, onChange, name, required = false }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>{label}</label>}
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-ice)',
                    outline: 'none',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
        </div>
    )
}

export default Input
