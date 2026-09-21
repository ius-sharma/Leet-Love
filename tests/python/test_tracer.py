"""Only repository-authored fixtures are executed locally. Never import uploads."""
import unittest
from workers.python.runner import execute, inspect, Unsupported

SLIDING = '''class Solution:
    def findMaxAverage(self, nums, k):
        total = sum(nums[:k])
        best = total
        for right in range(k, len(nums)):
            total -= nums[right - k]
            total += nums[right]
            best = max(best, total)
        return best / k
'''
BRUTE = '''class Solution:
    def findMaxAverage(self, nums, k):
        best = -10001
        for start in range(len(nums) - k + 1):
            total = 0
            for i in range(start, start + k):
                total += nums[i]
            best = max(best, total / k)
        return best
'''

class TracerTests(unittest.TestCase):
    def test_original_and_traced_agree(self):
        for source in [SLIDING, BRUTE]:
            for args, answer in [([[1,12,-5,-6,50,3],4],12.75),([[-8,-2,-4],2],-3),([[7],1],7)]:
                plain=execute(source,'findMaxAverage',args)
                traced=execute(source,'findMaxAverage',args,True)
                self.assertEqual(plain['result'],answer)
                self.assertEqual(traced['result'],answer)
                self.assertEqual(plain['mutatedInput'],traced['mutatedInput'])
                self.assertEqual(traced['trace']['events'][-1]['kind'],'return')

    def test_snapshots_keep_values_and_alias_identity(self):
        source='''class Solution:
    def test(self, nums):
        other = nums
        nums[0] = 9
        return other[0]
'''
        events=execute(source,'test',[[1,2]],True)['trace']['events']
        self.assertEqual(events[0]['locals']['nums'],[1,2])
        self.assertEqual(events[-1]['locals']['nums'],[9,2])
        self.assertEqual(events[-1]['collections']['nums'],events[-1]['collections']['other'])

    def test_collection_types_preserved(self):
        source='''class Solution:
    def test(self, s):
        seen = set(s)
        return len(seen)
'''
        result=execute(source,'test',['aba'],True)
        self.assertEqual(result['trace']['events'][-1]['collections']['seen']['kind'],'set')

    def test_source_mapping_is_before_then_return(self):
        events=execute(SLIDING,'findMaxAverage',[[1,2],2],True)['trace']['events']
        self.assertEqual(events[0]['line'],3)
        self.assertNotIn('total',events[0]['locals'])
        self.assertEqual(events[1]['locals']['total'],3)
        self.assertEqual(events[-1]['result'],1.5)

    def test_rejects_untrusted_capabilities_without_execution(self):
        bodies=['return open("secret")','return eval("1")','return nums.__class__','import os\n        return 1','def hidden():\n            return 1\n        return 1','return getattr(nums,"x")']
        for body in bodies:
            with self.subTest(body=body),self.assertRaises(Unsupported):
                inspect('class Solution:\n    def test(self, nums):\n        '+body+'\n','test')

    def test_trace_limit_is_explicit_not_truncated_success(self):
        with self.assertRaisesRegex(Unsupported,'500'):
            execute(BRUTE,'findMaxAverage',[list(range(32)),16],True)

if __name__ == '__main__':
    unittest.main()
