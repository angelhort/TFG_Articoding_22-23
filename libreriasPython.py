import subprocess

dependencies = [
    'pandas',
    'json',
    'collections',
    'plotly',
    'statistics',
    're',
    'numpy',
    'scikit-learn',
    'datetime'
]

def install_package(package):
    try:
        subprocess.check_call(['pip3', 'install', package])
        print("Instalando: " + package)
    except subprocess.CalledProcessError as e:
        print(f'Error al instalar el paquete {package}: {str(e)}')

def install_dependencies(dependencies):
    for package in dependencies:
        install_package(package)

if __name__ == '__main__':
    install_dependencies(dependencies)