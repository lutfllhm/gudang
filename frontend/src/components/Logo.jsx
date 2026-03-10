import PropTypes from 'prop-types'

const Logo = ({ variant = 'default', size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const variants = {
    default: '', // Original logo color
    indigo: 'logo-indigo', // For admin dashboard (indigo/purple theme)
    blue: 'logo-blue', // For homepage/login (blue theme)
    neon: 'logo-neon', // For schedule page (neon cyan theme)
    white: 'logo-white' // For dark backgrounds
  }

  return (
    <>
      <img 
        src="/logo.png" 
        alt="iware" 
        className={`${sizes[size]} ${variants[variant]} ${className} transition-all duration-300`}
      />
      
      <style>{`
        /* Indigo/Purple filter for admin dashboard */
        .logo-indigo {
          filter: 
            brightness(1.1)
            saturate(1.3)
            hue-rotate(-10deg)
            drop-shadow(0 0 8px rgba(99, 102, 241, 0.3));
        }

        .logo-indigo:hover {
          filter: 
            brightness(1.2)
            saturate(1.4)
            hue-rotate(-10deg)
            drop-shadow(0 0 12px rgba(99, 102, 241, 0.5));
        }

        /* Blue filter for homepage/login */
        .logo-blue {
          filter: 
            brightness(1.1)
            saturate(1.2)
            hue-rotate(10deg)
            drop-shadow(0 0 8px rgba(59, 130, 246, 0.3));
        }

        .logo-blue:hover {
          filter: 
            brightness(1.2)
            saturate(1.3)
            hue-rotate(10deg)
            drop-shadow(0 0 12px rgba(59, 130, 246, 0.5));
        }

        /* Neon cyan filter for schedule page */
        .logo-neon {
          filter: 
            brightness(1.3)
            saturate(1.5)
            hue-rotate(180deg)
            drop-shadow(0 0 15px rgba(34, 211, 238, 0.6))
            drop-shadow(0 0 25px rgba(34, 211, 238, 0.4));
        }

        .logo-neon:hover {
          filter: 
            brightness(1.4)
            saturate(1.6)
            hue-rotate(180deg)
            drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))
            drop-shadow(0 0 30px rgba(34, 211, 238, 0.5));
        }

        /* White/light filter for dark backgrounds */
        .logo-white {
          filter: 
            brightness(2)
            saturate(0)
            drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
        }

        .logo-white:hover {
          filter: 
            brightness(2.2)
            saturate(0)
            drop-shadow(0 0 12px rgba(255, 255, 255, 0.5));
        }
      `}</style>
    </>
  )
}

Logo.propTypes = {
  variant: PropTypes.oneOf(['default', 'indigo', 'blue', 'neon', 'white']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string
}

export default Logo
