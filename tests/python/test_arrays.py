"""Repository-owned array fixtures only; uploaded code never runs locally."""
import unittest
from workers.python.runner import execute, encode, Unsupported

PAIR = '''class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, value in enumerate(nums):
            need = target - value
            if need in seen:
                return [seen[need], i]
            seen[value] = i
        return []
'''
REVERSE = '''class Solution:
    def reverseArray(self, nums):
        left, right = 0, len(nums) - 1
        while left < right:
            nums[left], nums[right] = nums[right], nums[left]
            left += 1
            right -= 1
        return nums
'''

class ArrayTracerTests(unittest.TestCase):
    def test_integer_lookup_is_traced_without_changing_execution(self):
        for args, expected in [([[3, 2, 4, 7], 6], [1, 2]), ([[3, 3], 6], [0, 1]), ([[3], 6], [])]:
            traced = execute(PAIR, 'twoSum', args, True)
            self.assertEqual(traced['result'], expected)
            self.assertEqual(traced['result'], execute(PAIR, 'twoSum', args)['result'])
            self.assertEqual(traced['trace']['events'][-1]['result'], expected)

    def test_reverse_tracks_actual_input_mutation(self):
        for nums in [[], [1], [1, 2, 3], [-4, 7, 0, 2]]:
            run = execute(REVERSE, 'reverseArray', [nums], True)
            self.assertEqual(run['result'], list(reversed(nums)))
            self.assertEqual(run['mutatedInput'][0], list(reversed(nums)))

    def test_mixed_key_collision_is_explicit(self):
        with self.assertRaises(Unsupported):
            encode({2: 0, '2': 1})
        self.assertEqual(encode({-2: 7}), {'-2': 7})
