"""
Reporting Module - Report Generation

This module handles report generation in multiple formats.
"""

import json
from datetime import datetime
from typing import List, Dict


class ReportGenerator:
    """Generate reports in various formats"""
    
    @staticmethod
    def generate_json(data: Dict, filename: str):
        """Generate JSON report"""
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
    
    @staticmethod
    def generate_html(data: Dict, filename: str):
        """Generate HTML report"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>API Discovery Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #2c3e50; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #3498db; color: white; }}
    </style>
</head>
<body>
    <h1>API Discovery Report</h1>
    <p>Target: {data.get('target', 'N/A')}</p>
    <p>Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    <p>Total Endpoints: {len(data.get('endpoints', []))}</p>
</body>
</html>"""
        
        with open(filename, 'w') as f:
            f.write(html)
    
    @staticmethod
    def generate_csv(data: Dict, filename: str):
        """Generate CSV report"""
        import csv
        
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['URL', 'Method', 'Discovered Via'])
            
            for endpoint in data.get('endpoints', []):
                writer.writerow([
                    endpoint.get('url', ''),
                    endpoint.get('method', 'GET'),
                    endpoint.get('discovered_via', '')
                ])
