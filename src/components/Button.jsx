import React from 'react'

const Button = ({ children, variant = 'primary', onClick, type = 'button', className = '', ...props }) => {
    const variantClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary'

    return (
        <button
            type={type}
            className={`${variantClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    )
}

export default Button
