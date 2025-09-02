"""CDP Client package for Web3 UPI."""

from .eth_account import MetaMaskAccount
from .clientInitialization import CDPClientWithMetaMask, initialize_client

__all__ = ['MetaMaskAccount', 'CDPClientWithMetaMask', 'initialize_client']
