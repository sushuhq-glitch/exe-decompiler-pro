"""
Template Engine Module - Keyword Generation Template System
"""

from typing import Dict, List, Optional, Set
import re
from collections import OrderedDict
from core.random_engine import RandomEngine

class TemplateCompilationError(Exception):
    pass

class TemplateRenderError(Exception):
    pass

class CompiledTemplate:
    def __init__(self, template: str):
        self.template = template
        self.variables = self._extract_variables(template)
    
    def _extract_variables(self, template: str) -> Set[str]:
        pattern = r'\{([a-zA-Z_][a-zA-Z0-9_]*)\}'
        return set(re.findall(pattern, template))
    
    def render(self, data: Dict[str, str]) -> str:
        missing = self.variables - set(data.keys())
        if missing:
            raise TemplateRenderError(f"Missing: {', '.join(missing)}")
        result = self.template
        for var in self.variables:
            result = result.replace(f"{{{var}}}", str(data[var]))
        return result
    
    def can_render(self, data: Dict[str, str]) -> bool:
        return self.variables.issubset(set(data.keys()))

class TemplateEngine:
    MAX_CACHE_SIZE = 1000
    
    def __init__(self, random_engine: Optional[RandomEngine] = None):
        self._templates: List[CompiledTemplate] = []
        self._template_cache: OrderedDict[str, CompiledTemplate] = OrderedDict()
        self._weights: List[float] = []
        self._random = random_engine or RandomEngine()
    
    def add_template(self, template: str, weight: float = 1.0) -> CompiledTemplate:
        if not template or not isinstance(template, str):
            raise TemplateCompilationError("Template must be non-empty string")
        if weight <= 0:
            raise ValueError(f"Weight must be positive, got {weight}")
        if template in self._template_cache:
            compiled = self._template_cache[template]
        else:
            compiled = CompiledTemplate(template)
            self._template_cache[template] = compiled
            if len(self._template_cache) > self.MAX_CACHE_SIZE:
                self._template_cache.popitem(last=False)
        self._templates.append(compiled)
        self._weights.append(weight)
        return compiled
    
    def add_templates(self, templates: List[str], weights: Optional[List[float]] = None) -> int:
        if weights is None:
            weights = [1.0] * len(templates)
        if len(templates) != len(weights):
            raise ValueError("Templates and weights must have same length")
        count = 0
        for template, weight in zip(templates, weights):
            try:
                self.add_template(template, weight)
                count += 1
            except TemplateCompilationError:
                continue
        return count
    
    def render(self, template: str, data: Dict[str, str]) -> str:
        if template in self._template_cache:
            compiled = self._template_cache[template]
        else:
            compiled = CompiledTemplate(template)
            self._template_cache[template] = compiled
        return compiled.render(data)
    
    def render_random(self, data: Dict[str, str]) -> str:
        if not self._templates:
            raise TemplateRenderError("No templates available")
        valid_templates = []
        valid_weights = []
        for template, weight in zip(self._templates, self._weights):
            if template.can_render(data):
                valid_templates.append(template)
                valid_weights.append(weight)
        if not valid_templates:
            raise TemplateRenderError(f"No templates compatible with data")
        selected = self._random.weighted_choice(valid_templates, valid_weights)
        return selected.render(data)
    
    def render_all(self, data: Dict[str, str]) -> List[str]:
        results = []
        for template in self._templates:
            if template.can_render(data):
                try:
                    results.append(template.render(data))
                except TemplateRenderError:
                    continue
        return results
    
    def get_required_variables(self) -> Set[str]:
        all_vars = set()
        for template in self._templates:
            all_vars.update(template.variables)
        return all_vars
    
    def get_template_count(self) -> int:
        return len(self._templates)
    
    def clear_templates(self) -> None:
        self._templates.clear()
        self._weights.clear()
    
    def clear_cache(self) -> None:
        self._template_cache.clear()
    
    def validate_data(self, data: Dict[str, str]) -> tuple:
        required = self.get_required_variables()
        provided = set(data.keys())
        missing = required - provided
        for template in self._templates:
            if template.can_render(data):
                return (True, set())
        return (False, missing)
