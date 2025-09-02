from setuptools import setup, find_packages

setup(
    name="cdp_client",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'web3>=6.0.0',
        'eth-account>=0.5.9',
        'python-dotenv>=0.19.0',
        'cdp-sdk',  # Make sure this is the correct package name for CDP
    ],
    python_requires='>=3.8',
)
