"""
Template Engine Module - Keyword Generation Template System
"""

from typing import Dict, List, Optional, Set, Any
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
    
    def load_templates(self, templates: List[str]) -> int:
        """
        Load multiple templates at once.
        
        Args:
            templates: List of template strings.
            
        Returns:
            Number of templates successfully loaded.
            
        Example:
            >>> engine = TemplateEngine()
            >>> count = engine.load_templates(["{brand} {product}", "{product} {intent}"])
            >>> print(f"Loaded {count} templates")
        """
        return self.add_templates(templates)
    
    def validate_template(self, template: str) -> bool:
        """
        Validate a template string.
        
        Args:
            template: Template string to validate.
            
        Returns:
            True if template is valid, False otherwise.
            
        Example:
            >>> engine = TemplateEngine()
            >>> is_valid = engine.validate_template("{brand} {product}")
        """
        if not template or not isinstance(template, str):
            return False
        
        try:
            compiled = CompiledTemplate(template)
            # Check if template has at least one variable
            return len(compiled.variables) > 0
        except Exception:
            return False
    
    def compile_template(self, template: str) -> CompiledTemplate:
        """
        Compile a template string.
        
        Args:
            template: Template string to compile.
            
        Returns:
            CompiledTemplate object.
            
        Raises:
            TemplateCompilationError: If template is invalid.
            
        Example:
            >>> engine = TemplateEngine()
            >>> compiled = engine.compile_template("{brand} {product}")
        """
        if not self.validate_template(template):
            raise TemplateCompilationError(f"Invalid template: {template}")
        
        if template in self._template_cache:
            return self._template_cache[template]
        
        compiled = CompiledTemplate(template)
        self._template_cache[template] = compiled
        
        if len(self._template_cache) > self.MAX_CACHE_SIZE:
            self._template_cache.popitem(last=False)
        
        return compiled
    
    def get_random_template(self) -> Optional[CompiledTemplate]:
        """
        Get a random template from the loaded templates.
        
        Returns:
            Random CompiledTemplate or None if no templates.
            
        Example:
            >>> engine = TemplateEngine()
            >>> engine.add_template("{brand} {product}")
            >>> template = engine.get_random_template()
        """
        if not self._templates:
            return None
        
        return self._random.weighted_choice(self._templates, self._weights)
    
    def get_template_by_index(self, index: int) -> Optional[CompiledTemplate]:
        """
        Get template by index.
        
        Args:
            index: Template index.
            
        Returns:
            CompiledTemplate at index or None.
        """
        if 0 <= index < len(self._templates):
            return self._templates[index]
        return None
    
    def get_all_templates(self) -> List[CompiledTemplate]:
        """
        Get all loaded templates.
        
        Returns:
            List of CompiledTemplate objects.
        """
        return self._templates.copy()
    
    def get_templates_with_variable(self, variable: str) -> List[CompiledTemplate]:
        """
        Get templates that use a specific variable.
        
        Args:
            variable: Variable name to search for.
            
        Returns:
            List of templates using the variable.
            
        Example:
            >>> engine = TemplateEngine()
            >>> templates = engine.get_templates_with_variable("brand")
        """
        return [t for t in self._templates if variable in t.variables]
    
    def get_templates_by_complexity(self, min_vars: int = 0, max_vars: int = 10) -> List[CompiledTemplate]:
        """
        Get templates by complexity (number of variables).
        
        Args:
            min_vars: Minimum number of variables.
            max_vars: Maximum number of variables.
            
        Returns:
            List of templates matching criteria.
            
        Example:
            >>> engine = TemplateEngine()
            >>> simple = engine.get_templates_by_complexity(min_vars=1, max_vars=2)
        """
        return [t for t in self._templates 
                if min_vars <= len(t.variables) <= max_vars]
    
    def get_cache_size(self) -> int:
        """
        Get current cache size.
        
        Returns:
            Number of cached templates.
        """
        return len(self._template_cache)
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Get cache information.
        
        Returns:
            Dictionary with cache statistics.
        """
        return {
            'cache_size': len(self._template_cache),
            'max_cache_size': self.MAX_CACHE_SIZE,
            'cache_hit_ratio': 0.0,  # Would need to track hits/misses
        }
    
    def set_max_cache_size(self, size: int) -> None:
        """
        Set maximum cache size.
        
        Args:
            size: Maximum cache size.
        """
        self.MAX_CACHE_SIZE = max(1, size)
        
        # Trim cache if needed
        while len(self._template_cache) > self.MAX_CACHE_SIZE:
            self._template_cache.popitem(last=False)
    
    def remove_template(self, index: int) -> bool:
        """
        Remove template by index.
        
        Args:
            index: Template index to remove.
            
        Returns:
            True if removed, False if index invalid.
        """
        if 0 <= index < len(self._templates):
            del self._templates[index]
            del self._weights[index]
            return True
        return False
    
    def remove_templates_with_variable(self, variable: str) -> int:
        """
        Remove all templates using a specific variable.
        
        Args:
            variable: Variable name.
            
        Returns:
            Number of templates removed.
        """
        indices_to_remove = []
        for i, template in enumerate(self._templates):
            if variable in template.variables:
                indices_to_remove.append(i)
        
        # Remove in reverse order to maintain indices
        for i in reversed(indices_to_remove):
            del self._templates[i]
            del self._weights[i]
        
        return len(indices_to_remove)
    
    def set_template_weight(self, index: int, weight: float) -> bool:
        """
        Set weight for a template.
        
        Args:
            index: Template index.
            weight: New weight value.
            
        Returns:
            True if set, False if index invalid.
        """
        if 0 <= index < len(self._weights) and weight > 0:
            self._weights[index] = weight
            return True
        return False
    
    def normalize_weights(self) -> None:
        """
        Normalize all template weights to sum to 1.0.
        
        Example:
            >>> engine = TemplateEngine()
            >>> engine.normalize_weights()
        """
        if not self._weights:
            return
        
        total = sum(self._weights)
        if total > 0:
            self._weights = [w / total for w in self._weights]
    
    def get_weight(self, index: int) -> Optional[float]:
        """
        Get weight for a template.
        
        Args:
            index: Template index.
            
        Returns:
            Weight value or None if invalid index.
        """
        if 0 <= index < len(self._weights):
            return self._weights[index]
        return None
    
    def get_all_weights(self) -> List[float]:
        """
        Get all template weights.
        
        Returns:
            List of weight values.
        """
        return self._weights.copy()
    
    def export_templates(self) -> List[Dict[str, Any]]:
        """
        Export templates as a list of dictionaries.
        
        Returns:
            List of template dictionaries.
            
        Example:
            >>> engine = TemplateEngine()
            >>> exported = engine.export_templates()
        """
        return [
            {
                'template': template.template,
                'variables': list(template.variables),
                'weight': weight,
            }
            for template, weight in zip(self._templates, self._weights)
        ]
    
    def import_templates(self, templates_data: List[Dict[str, Any]]) -> int:
        """
        Import templates from a list of dictionaries.
        
        Args:
            templates_data: List of template dictionaries.
            
        Returns:
            Number of templates imported.
            
        Example:
            >>> engine = TemplateEngine()
            >>> data = [{'template': '{brand}', 'weight': 1.0}]
            >>> count = engine.import_templates(data)
        """
        count = 0
        for item in templates_data:
            try:
                template = item.get('template')
                weight = item.get('weight', 1.0)
                if template:
                    self.add_template(template, weight)
                    count += 1
            except Exception:
                continue
        return count
    
    def find_templates(self, pattern: str) -> List[CompiledTemplate]:
        """
        Find templates containing a pattern.
        
        Args:
            pattern: Pattern to search for.
            
        Returns:
            List of matching templates.
            
        Example:
            >>> engine = TemplateEngine()
            >>> matches = engine.find_templates("brand")
        """
        return [t for t in self._templates if pattern in t.template]
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive template engine statistics.
        
        Returns:
            Dictionary of statistics.
            
        Example:
            >>> engine = TemplateEngine()
            >>> stats = engine.get_statistics()
        """
        if self._templates:
            avg_vars = sum(len(t.variables) for t in self._templates) / len(self._templates)
            max_vars = max(len(t.variables) for t in self._templates)
            min_vars = min(len(t.variables) for t in self._templates)
        else:
            avg_vars = 0
            max_vars = 0
            min_vars = 0
        
        return {
            'template_count': len(self._templates),
            'cache_size': len(self._template_cache),
            'max_cache_size': self.MAX_CACHE_SIZE,
            'total_weight': sum(self._weights) if self._weights else 0,
            'avg_variables_per_template': avg_vars,
            'max_variables': max_vars,
            'min_variables': min_vars,
            'unique_variables': len(self.get_required_variables()),
        }
    
    def optimize_cache(self) -> None:
        """
        Optimize cache by removing least recently used entries.
        
        Example:
            >>> engine = TemplateEngine()
            >>> engine.optimize_cache()
        """
        target_size = self.MAX_CACHE_SIZE // 2
        while len(self._template_cache) > target_size:
            self._template_cache.popitem(last=False)
    
    def reset(self) -> None:
        """
        Reset engine to initial state.
        
        Example:
            >>> engine = TemplateEngine()
            >>> engine.reset()
        """
        self.clear_templates()
        self.clear_cache()
    
    def __len__(self) -> int:
        """Return number of templates."""
        return len(self._templates)
    
    def __getitem__(self, index: int) -> CompiledTemplate:
        """Get template by index."""
        return self._templates[index]
    
    def __repr__(self) -> str:
        """String representation."""
        return f"TemplateEngine(templates={len(self._templates)}, cache={len(self._template_cache)})"
    
    def __str__(self) -> str:
        """Human-readable string representation."""
        return f"TemplateEngine with {len(self._templates)} templates"
    
    def __contains__(self, template: str) -> bool:
        """Check if template exists."""
        return template in self._template_cache
    
    def batch_render(self, templates: List[str], data: Dict[str, str]) -> List[str]:
        """
        Render multiple templates with same data.
        
        Args:
            templates: List of template strings.
            data: Data dictionary.
            
        Returns:
            List of rendered strings.
        """
        results = []
        for template in templates:
            try:
                rendered = self.render(template, data)
                results.append(rendered)
            except TemplateRenderError:
                continue
        return results
    
    def test_template(self, template: str, data: Dict[str, str]) -> tuple:
        """
        Test if a template can be rendered with given data.
        
        Args:
            template: Template string.
            data: Data dictionary.
            
        Returns:
            Tuple of (success: bool, result: str or error message).
        """
        try:
            result = self.render(template, data)
            return (True, result)
        except Exception as e:
            return (False, str(e))
