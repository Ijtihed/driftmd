import argparse

parser = argparse.ArgumentParser(description='Parse input files')
parser.add_argument('--input', '-i', type=str, help='Input file')
parser.add_argument('--output', '-o', type=str, help='Output file')
parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
parser.add_argument('--quiet', '-q', action='store_true', help='Suppress output')
parser.add_argument('--format', type=str, choices=['json', 'csv'], help='Format')
