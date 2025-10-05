#!/usr/bin/env python3
"""
Auto email verification monitor for dataset import
Runs alongside product import to automatically verify newly registered users
"""

import subprocess
import time
import logging

logger = logging.getLogger(__name__)

def verify_unverified_users():
    """Verify all unverified users in the database"""
    cmd = [
        'docker', 'exec', 'koalaswap-pg', 'psql',
        '-U', 'koalaswap', '-d', 'koalaswap_dev',
        '-c', "UPDATE users SET email_verified = true, updated_at = NOW() WHERE email_verified = false;"
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            output = result.stdout.strip()
            if "UPDATE" in output:
                count = output.split()[1] if len(output.split()) > 1 else "0"
                if count != "0":
                    logger.info(f"Auto-verified {count} users")
                return int(count)
        return 0
    except Exception as e:
        logger.error(f"Failed to auto-verify users: {e}")
        return 0

def monitor_loop(interval=5, max_duration=3600):
    """Monitor and auto-verify users for a specified duration"""
    logger.info(f"Starting email verification monitor (interval={interval}s, max_duration={max_duration}s)")

    start_time = time.time()
    total_verified = 0

    while time.time() - start_time < max_duration:
        verified_count = verify_unverified_users()
        total_verified += verified_count

        time.sleep(interval)

    logger.info(f"Monitor completed. Total users auto-verified: {total_verified}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    monitor_loop()