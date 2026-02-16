import React from 'react'

const Card = ({ children, className = '', title, action, noPadding = false, style = {} }) => {
    return (
        <div
            className={`glass-card ${className}`}
            style={{
                height: '100%',
                padding: noPadding ? '0' : '24px',
                background: 'var(--card-bg)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                ...style
            }}
        >
            {(title || action) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    {title && <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div style={{ height: '100%' }}>
                {children}
            </div>
        </div>
    )
}

export default Card
