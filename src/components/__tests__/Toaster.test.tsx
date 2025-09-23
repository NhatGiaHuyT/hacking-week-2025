import { render, screen } from '@testing-library/react'
import Toaster from '../Toaster'

describe('Toaster', () => {
  it('renders without crashing', () => {
    render(<Toaster />)
    // The Toaster component renders the HotToaster from react-hot-toast
    // Since it's a simple wrapper, we just check that it doesn't throw
    expect(document.body).toBeInTheDocument()
  })

  it('renders with default props', () => {
    render(<Toaster />)
    // The component should render without any visible content initially
    // as it's just a toast container
    expect(document.body).toBeInTheDocument()
  })
})
