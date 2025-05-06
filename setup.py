from setuptools import setup, find_packages

setup(
    name="project-d",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "pytest",
        "httpx"
    ],
) 