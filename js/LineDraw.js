// Load the SVG and animate the solution path
window.addEventListener('load', function() {
    const mazeImg = document.querySelector('.maze-container img');
    
    // Fetch the SVG content
    fetch(mazeImg.src)
        .then(response => response.text())
        .then(svgContent => {
            // Replace img with inline SVG so we can manipulate it
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');
            
            // Replace the img element with the SVG
            mazeImg.parentNode.replaceChild(svgElement, mazeImg);
            
            // Find the solution path by ID
            const solutionPath = svgElement.querySelector('#maze');
            
            if (solutionPath) {
                // Get the total length of the path
                const pathLength = solutionPath.getTotalLength();
                
                // Set up the path to be invisible initially
                solutionPath.style.strokeDasharray = pathLength;
                solutionPath.style.strokeDashoffset = pathLength;
                
                // Animate the path drawing
                const duration = 6000; // 6 seconds
                const startTime = Date.now();
                
                function animate() {
                    const currentTime = Date.now();
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Update the stroke offset
                    solutionPath.style.strokeDashoffset = pathLength * (1 - progress);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                }
                
                // Start animation after a short delay
                setTimeout(() => {
                    animate();
                }, 500);
            } else {
                console.error('Solution path #maze not found in SVG');
            }
        })
        .catch(error => console.error('Error loading SVG:', error));
});